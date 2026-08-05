import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CLASSROOM_CHAT_LM_SECRET_KEY,
  applyHostSecretRefToProviders,
  isChatLmSecretInputRef,
  isPlainClassroomApiKey,
  isUnsupportedByokHost,
  removeMatchingProviders,
  toChatLmSecretInputRef,
} from "../hostLmSecret";

describe("toChatLmSecretInputRef", () => {
  it("wraps the Host secret key in ${input:…}", () => {
    assert.equal(
      toChatLmSecretInputRef(CLASSROOM_CHAT_LM_SECRET_KEY),
      "${input:chat.lm.secret.-7a55c1a5}",
    );
  });
});

describe("isChatLmSecretInputRef / isPlainClassroomApiKey", () => {
  it("detects Host secret refs vs plaintext Classroom API Key", () => {
    assert.equal(
      isChatLmSecretInputRef("${input:chat.lm.secret.-7a55c1a5}"),
      true,
    );
    assert.equal(isChatLmSecretInputRef("vcr_sk_abc"), false);
    assert.equal(isPlainClassroomApiKey("vcr_sk_abc"), true);
    assert.equal(
      isPlainClassroomApiKey("${input:chat.lm.secret.-7a55c1a5}"),
      false,
    );
  });
});

describe("applyHostSecretRefToProviders", () => {
  it("sets apiKey ref on matching vendor+name only", () => {
    const providers = applyHostSecretRefToProviders(
      [
        { name: "OpenRouter", vendor: "openrouter", apiKey: "keep" },
        { name: "VCRouter", vendor: "customendpoint", apiKey: "vcr_sk_old" },
      ],
      { name: "VCRouter", vendor: "customendpoint" },
      "${input:chat.lm.secret.-7a55c1a5}",
    );
    assert.equal(providers[0]?.apiKey, "keep");
    assert.equal(
      providers[1]?.apiKey,
      "${input:chat.lm.secret.-7a55c1a5}",
    );
  });
});

describe("removeMatchingProviders / isUnsupportedByokHost", () => {
  it("drops only the matched provider", () => {
    const next = removeMatchingProviders(
      [
        { name: "OpenRouter", vendor: "openrouter" },
        { name: "VCRouter", vendor: "customendpoint" },
      ],
      { name: "VCRouter", vendor: "customendpoint" },
    );
    assert.equal(next.length, 1);
    assert.equal(next[0]?.name, "OpenRouter");
  });

  it("treats Cursor as unsupported BYOK host", () => {
    assert.equal(isUnsupportedByokHost("cursor"), true);
    assert.equal(isUnsupportedByokHost("vscode"), false);
  });
});
