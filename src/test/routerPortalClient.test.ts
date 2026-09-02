import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createRouterPortalClient } from "../routerPortalClient";

describe("createRouterPortalClient nickname redeem", () => {
  it("POSTs invite_code and nickname to /extension/sessions/nickname-redeem", async () => {
    const original = globalThis.fetch;
    let url = "";
    let body = "";
    globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
      url = String(input);
      body = String(init?.body ?? "");
      return new Response(
        JSON.stringify({
          api_key: "vcr_sk_x",
          session: { class_name: "Demo", name: "Week 1" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;
    try {
      const client = createRouterPortalClient("https://ai.vanscoding.com/");
      const result = await client.redeemWithNickname("ABC12345", "Ada");
      assert.equal(
        url,
        "https://ai.vanscoding.com/extension/sessions/nickname-redeem",
      );
      assert.deepEqual(JSON.parse(body), {
        invite_code: "ABC12345",
        nickname: "Ada",
      });
      assert.equal(result.api_key, "vcr_sk_x");
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe("createRouterPortalClient chat-language-models", () => {
  it("sends Bearer Classroom API Key when fetching the Session Model Allowlist", async () => {
    const original = globalThis.fetch;
    let url = "";
    let auth = "";
    globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
      url = String(input);
      const headers = new Headers(init?.headers);
      auth = headers.get("Authorization") ?? "";
      return new Response(
        JSON.stringify([
          {
            name: "VCRouter",
            vendor: "customendpoint",
            models: [{ id: "ollama_cloud@mini:cloud", name: "mini" }],
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;
    try {
      const client = createRouterPortalClient("https://ai.vanscoding.com/");
      const models = await client.fetchChatLanguageModelsTemplate("vcr_sk_x");
      assert.equal(
        url,
        "https://ai.vanscoding.com/extension/chat-language-models",
      );
      assert.equal(auth, "Bearer vcr_sk_x");
      assert.equal(models[0]?.models?.length, 1);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("omits Authorization when prechecking the Router Model Template", async () => {
    const original = globalThis.fetch;
    let hasAuthHeader = false;
    globalThis.fetch = (async (_input: string | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      hasAuthHeader = headers.has("Authorization");
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;
    try {
      const client = createRouterPortalClient("https://ai.vanscoding.com/");
      await client.fetchChatLanguageModelsTemplate();
      assert.equal(hasAuthHeader, false);
    } finally {
      globalThis.fetch = original;
    }
  });
});
