import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CLASSROOM_CHAT_LM_SECRET_KEY,
  toChatLmSecretInputRef,
} from "../hostLmSecret";
import { spikeByokHostSecret } from "../spikeByokHostSecret";

describe("spikeByokHostSecret", () => {
  it("stores Classroom API Key under Host secret key and rewrites apiKey to ${input:…}", async () => {
    const files = new Map<string, string>();
    const target = "/tmp/user/chatLanguageModels.json";
    files.set(
      target,
      JSON.stringify(
        [
          {
            name: "VCRouter",
            vendor: "customendpoint",
            apiKey: "vcr_sk_from_file",
            models: [],
          },
        ],
        null,
        2,
      ),
    );
    const secrets = new Map<string, string>();

    const result = await spikeByokHostSecret({
      modelsPath: target,
      match: { name: "VCRouter", vendor: "customendpoint" },
      getClassroomApiKey: async () => undefined,
      storeSecret: async (key, value) => {
        secrets.set(key, value);
      },
      readFile: async (p) => {
        const v = files.get(p);
        if (v === undefined) {
          const err = new Error("missing") as NodeJS.ErrnoException;
          err.code = "ENOENT";
          throw err;
        }
        return v;
      },
      writeFile: async (p, data) => {
        files.set(p, data);
      },
    });

    assert.equal(result.secretKey, CLASSROOM_CHAT_LM_SECRET_KEY);
    assert.equal(result.apiKeyRef, toChatLmSecretInputRef(CLASSROOM_CHAT_LM_SECRET_KEY));
    assert.equal(secrets.get(CLASSROOM_CHAT_LM_SECRET_KEY), "vcr_sk_from_file");
    const written = JSON.parse(files.get(target) ?? "null");
    assert.equal(written[0].apiKey, result.apiKeyRef);
  });

  it("prefers SecretStorage classroomApiKey over plaintext in the file", async () => {
    const files = new Map<string, string>();
    const target = "/tmp/user/chatLanguageModels.json";
    files.set(
      target,
      JSON.stringify([
        {
          name: "VCRouter",
          vendor: "customendpoint",
          apiKey: "vcr_sk_stale",
          models: [],
        },
      ]),
    );
    const secrets = new Map<string, string>();

    await spikeByokHostSecret({
      modelsPath: target,
      match: { name: "VCRouter", vendor: "customendpoint" },
      getClassroomApiKey: async () => "vcr_sk_from_extension",
      storeSecret: async (key, value) => {
        secrets.set(key, value);
      },
      readFile: async (p) => files.get(p)!,
      writeFile: async (p, data) => {
        files.set(p, data);
      },
    });

    assert.equal(
      secrets.get(CLASSROOM_CHAT_LM_SECRET_KEY),
      "vcr_sk_from_extension",
    );
  });
});
