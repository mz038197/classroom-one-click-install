import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CLASSROOM_CHAT_LM_SECRET_KEY,
  applyHostSecretRefToProviders,
  isChatLmSecretInputRef,
  isPlainClassroomApiKey,
  toChatLmSecretInputRef,
} from "../hostLmSecret";

describe("toChatLmSecretInputRef", () => {
  it("wraps the Host secret key in ${input:…}", () => {
    assert.equal(
      toChatLmSecretInputRef(CLASSROOM_CHAT_LM_SECRET_KEY),
      "${input:chat.lm.secret.vans-classroom}",
    );
  });
});

describe("isChatLmSecretInputRef / isPlainClassroomApiKey", () => {
  it("detects Host secret refs vs plaintext Classroom API Key", () => {
    assert.equal(
      isChatLmSecretInputRef("${input:chat.lm.secret.vans-classroom}"),
      true,
    );
    assert.equal(isChatLmSecretInputRef("vcr_sk_abc"), false);
    assert.equal(isPlainClassroomApiKey("vcr_sk_abc"), true);
    assert.equal(
      isPlainClassroomApiKey("${input:chat.lm.secret.vans-classroom}"),
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
      "${input:chat.lm.secret.vans-classroom}",
    );
    assert.equal(providers[0]?.apiKey, "keep");
    assert.equal(
      providers[1]?.apiKey,
      "${input:chat.lm.secret.vans-classroom}",
    );
  });
});
