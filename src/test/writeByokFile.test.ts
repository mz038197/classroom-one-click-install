import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chatLanguageModelsPath } from "../editorUserPath";
import { writeByokFile } from "../writeByokFile";

describe("writeByokFile", () => {
  it("merges template, writes api key, and returns target path", async () => {
    const files = new Map<string, string>();
    const target = await writeByokFile({
      userDir: "/tmp/user",
      template: [
        {
          name: "VCRouter",
          vendor: "customendpoint",
          apiKey: "",
          models: [{ id: "m1", name: "m1", url: "https://ai.vanscoding.com/v1" }],
        },
      ],
      apiKey: "${input:chat.lm.secret.-7a55c1a5}",
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
      mkdir: async () => undefined,
    });

    assert.match(target.path, /chatLanguageModels\.json$/);
    assert.equal(target.classroomModelsChanged, true);
    const written = JSON.parse(files.get(target.path) ?? "null");
    assert.equal(written[0].apiKey, "${input:chat.lm.secret.-7a55c1a5}");
    assert.equal(written[0].name, "VCRouter");
  });

  it("reports unchanged when the Session Model Allowlist already matches", async () => {
    const files = new Map<string, string>();
    const existing = [
      {
        name: "VCRouter",
        vendor: "customendpoint",
        apiKey: "${input:chat.lm.secret.-7a55c1a5}",
        models: [{ id: "m1", name: "m1", url: "https://ai.vanscoding.com/v1" }],
      },
    ];
    const template = [
      {
        name: "VCRouter",
        vendor: "customendpoint",
        apiKey: "",
        models: [{ id: "m1", name: "m1", url: "https://ai.vanscoding.com/v1" }],
      },
    ];
    files.set(
      chatLanguageModelsPath("/tmp/user"),
      `${JSON.stringify(existing, null, 2)}\n`,
    );
    const result = await writeByokFile({
      userDir: "/tmp/user",
      template,
      apiKey: "${input:chat.lm.secret.-7a55c1a5}",
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
      mkdir: async () => undefined,
    });
    assert.equal(result.classroomModelsChanged, false);
  });
});
