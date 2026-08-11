import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { copyClassroomApiKey } from "../copyClassroomApiKey";

describe("copyClassroomApiKey", () => {
  it("writes Classroom API Key to clipboard without returning the key", async () => {
    let clipboard = "";
    const result = await copyClassroomApiKey({
      getSecret: async () => "vcr_sk_copyme",
      writeClipboard: async (text) => {
        clipboard = text;
      },
    });
    assert.equal(result.ok, true);
    assert.equal(clipboard, "vcr_sk_copyme");
    assert.equal("key" in result, false);
  });

  it("fails when secret is missing or not a Classroom API Key", async () => {
    let wrote = false;
    const missing = await copyClassroomApiKey({
      getSecret: async () => undefined,
      writeClipboard: async () => {
        wrote = true;
      },
    });
    assert.equal(missing.ok, false);
    assert.equal(wrote, false);

    const junk = await copyClassroomApiKey({
      getSecret: async () => "not-a-key",
      writeClipboard: async () => {
        wrote = true;
      },
    });
    assert.equal(junk.ok, false);
    assert.equal(wrote, false);
  });
});
