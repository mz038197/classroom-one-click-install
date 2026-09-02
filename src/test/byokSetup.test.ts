import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyApiKeyToTemplate,
  classroomModelSignature,
  mergeByokConfig,
} from "../byokSetup";

describe("mergeByokConfig", () => {
  it("merges template providers and writes api key onto matching vendor/name", () => {
    const existing = [
      {
        name: "Other",
        vendor: "customendpoint",
        apiKey: "keep-me",
        models: [{ id: "x", name: "x", url: "https://example.com/v1" }],
      },
    ];
    const template = [
      {
        name: "VCRouter",
        vendor: "customendpoint",
        apiKey: "",
        apiType: "responses",
        models: [
          {
            id: "ollama_cloud@demo:cloud",
            name: "demo",
            url: "https://ai.vanscoding.com/v1",
          },
        ],
      },
    ];

    const merged = mergeByokConfig(existing, template, "vcr_sk_test");
    assert.equal(merged.length, 2);
    const vans = merged.find((p) => p.name === "VCRouter");
    assert.ok(vans);
    assert.equal(vans.apiKey, "vcr_sk_test");
    assert.equal(merged[0]?.apiKey, "keep-me");
  });

  it("updates api key when VCRouter already exists", () => {
    const existing = [
      {
        name: "VCRouter",
        vendor: "customendpoint",
        apiKey: "old",
        models: [{ id: "ollama_cloud@demo:cloud", name: "demo", url: "https://ai.vanscoding.com/v1" }],
      },
    ];
    const template = [
      {
        name: "VCRouter",
        vendor: "customendpoint",
        apiKey: "",
        models: [
          {
            id: "ollama_cloud@demo:cloud",
            name: "demo",
            url: "https://ai.vanscoding.com/v1",
            toolCalling: true,
          },
        ],
      },
    ];
    const merged = mergeByokConfig(existing, template, "vcr_sk_new");
    assert.equal(merged.length, 1);
    assert.equal(merged[0]?.apiKey, "vcr_sk_new");
    const model = (merged[0]?.models as Array<Record<string, unknown>>)[0];
    assert.equal(model?.toolCalling, true);
  });

  it("drops VCRouter models that are not on the Session Model Allowlist", () => {
    const existing = [
      {
        name: "OpenRouter",
        vendor: "openrouter",
        apiKey: "keep",
        models: [{ id: "keep-or", name: "keep-or" }],
      },
      {
        name: "VCRouter",
        vendor: "customendpoint",
        apiKey: "old",
        models: [
          { id: "ollama_cloud@opus:cloud", name: "opus" },
          { id: "ollama_cloud@mini:cloud", name: "mini" },
        ],
      },
    ];
    const template = [
      {
        name: "VCRouter",
        vendor: "customendpoint",
        apiKey: "",
        models: [{ id: "ollama_cloud@mini:cloud", name: "mini" }],
      },
    ];

    const merged = mergeByokConfig(existing, template, "vcr_sk_new");
    assert.equal(merged.length, 2);
    assert.equal(merged[0]?.apiKey, "keep");
    const ids = (merged[1]?.models as Array<Record<string, unknown>>).map(
      (m) => m.id,
    );
    assert.deepEqual(ids, ["ollama_cloud@mini:cloud"]);
    assert.equal(merged[1]?.apiKey, "vcr_sk_new");
  });

  it("clears VCRouter models when the Allowlist payload has no classroom provider", () => {
    const existing = [
      {
        name: "OpenRouter",
        vendor: "openrouter",
        apiKey: "keep",
        models: [{ id: "keep-or", name: "keep-or" }],
      },
      {
        name: "VCRouter",
        vendor: "customendpoint",
        apiKey: "old",
        models: [{ id: "ollama_cloud@opus:cloud", name: "opus" }],
      },
    ];
    const merged = mergeByokConfig(existing, [], "vcr_sk_new");
    assert.equal(merged[0]?.apiKey, "keep");
    assert.deepEqual(merged[1]?.models, []);
    assert.equal(merged[1]?.apiKey, "vcr_sk_new");
  });
});

describe("classroomModelSignature", () => {
  it("changes when a VCRouter model is removed from the Allowlist", () => {
    const before = classroomModelSignature([
      {
        name: "VCRouter",
        vendor: "customendpoint",
        models: [{ id: "opus" }, { id: "mini" }],
      },
    ]);
    const after = classroomModelSignature([
      {
        name: "VCRouter",
        vendor: "customendpoint",
        models: [{ id: "mini" }],
      },
    ]);
    assert.notEqual(before, after);
    assert.equal(after, "customendpoint\0VCRouter\0mini");
  });
});

describe("applyApiKeyToTemplate", () => {
  it("sets apiKey on every top-level provider from template family", () => {
    const providers = applyApiKeyToTemplate(
      [{ name: "VCRouter", vendor: "customendpoint", apiKey: "" }],
      "vcr_sk_x",
    );
    assert.equal(providers[0]?.apiKey, "vcr_sk_x");
  });
});
