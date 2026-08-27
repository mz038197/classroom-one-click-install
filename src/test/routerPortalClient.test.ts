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
