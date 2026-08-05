import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clearClassroomConnection } from "../clearClassroomConnection";
import { chatLanguageModelsPath } from "../editorUserPath";
import { CLASSROOM_CHAT_LM_SECRET_KEY } from "../hostLmSecret";

describe("clearClassroomConnection", () => {
  it("removes VCRouter, Host secret, and extension secrets; keeps other providers", async () => {
    const files = new Map<string, string>();
    const userDir = "/tmp/user";
    const modelsPath = chatLanguageModelsPath(userDir);
    files.set(
      modelsPath,
      JSON.stringify([
        { name: "OpenRouter", vendor: "openrouter", apiKey: "keep" },
        {
          name: "VCRouter",
          vendor: "customendpoint",
          apiKey: "${input:chat.lm.secret.-7a55c1a5}",
        },
      ]),
    );
    const deletedSecrets: string[] = [];
    let hostDeleteArgs:
      | { stateDbPath: string; secretKey?: string }
      | undefined;

    await clearClassroomConnection({
      userDir,
      stateDbPath: "/tmp/user/globalStorage/state.vscdb",
      deleteSecret: async (key) => {
        deletedSecrets.push(key);
      },
      deleteHostSecret: async (args) => {
        hostDeleteArgs = args;
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

    const written = JSON.parse(files.get(modelsPath) ?? "null");
    assert.equal(written.length, 1);
    assert.equal(written[0].name, "OpenRouter");
    assert.deepEqual(hostDeleteArgs, {
      stateDbPath: "/tmp/user/globalStorage/state.vscdb",
      secretKey: CLASSROOM_CHAT_LM_SECRET_KEY,
    });
    assert.deepEqual(deletedSecrets.sort(), [
      CLASSROOM_CHAT_LM_SECRET_KEY,
      "classroomApiKey",
    ].sort());
  });

  it("propagates deleteSecret failures", async () => {
    await assert.rejects(
      () =>
        clearClassroomConnection({
          userDir: "/tmp/user",
          stateDbPath: "/tmp/user/globalStorage/state.vscdb",
          deleteSecret: async () => {
            throw new Error("secret delete failed");
          },
          deleteHostSecret: async () => undefined,
          readFile: async () => {
            const err = new Error("missing") as NodeJS.ErrnoException;
            err.code = "ENOENT";
            throw err;
          },
        }),
      /secret delete failed/,
    );
  });
});
