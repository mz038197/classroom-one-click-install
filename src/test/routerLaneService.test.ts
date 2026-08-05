import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RouterLaneService } from "../routerLaneService";
import type { RouterPortalClient } from "../routerPortalClient";

const sampleToken =
  "n1:1:1700000000:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";

describe("RouterLaneService", () => {
  it("redeems with handoff then writes BYOK and reaches ready", async () => {
    const secrets = new Map<string, string>();
    let wroteKey = "";
    const client: RouterPortalClient = {
      fetchChatLanguageModelsTemplate: async () => [
        { name: "VCRouter", vendor: "customendpoint", apiKey: "", models: [] },
      ],
      redeemWithHandoff: async (token, invite) => {
        assert.equal(token, sampleToken);
        assert.equal(invite, "ABC12345");
        return {
          api_key: "vcr_sk_testkey",
          session: {
            invite_code: invite,
            class_name: "Demo",
            name: "Week 1",
            expires_at: "2099-01-01T00:00:00Z",
          },
        };
      },
    };

    const lane = new RouterLaneService(client, {
      baseUrl: "https://ai.vanscoding.com",
      openExternal: async () => true,
      resolveUserDir: () => "/tmp/Code/User",
      secretStore: {
        get: async (k) => secrets.get(k),
        store: async (k, v) => {
          secrets.set(k, v);
        },
      },
      writeByok: async ({ apiKey }) => {
        wroteKey = apiKey;
        return "/tmp/Code/User/chatLanguageModels.json";
      },
    });

    lane.setInviteCode("ABC12345");
    await lane.acceptHandoffInput(sampleToken);

    assert.equal(lane.getView().status, "ready");
    assert.equal(wroteKey, "vcr_sk_testkey");
    assert.equal(secrets.get("classroomApiKey"), "vcr_sk_testkey");
    assert.match(lane.getView().detail, /BYOK/);
  });

  it("asks for sign-in when redeeming without handoff", async () => {
    const client: RouterPortalClient = {
      fetchChatLanguageModelsTemplate: async () => [],
      redeemWithHandoff: async () => {
        throw new Error("should not redeem");
      },
    };
    const lane = new RouterLaneService(client, {
      baseUrl: "https://ai.vanscoding.com",
      openExternal: async () => true,
      resolveUserDir: () => "/tmp/u",
      secretStore: {
        get: async () => undefined,
        store: async () => undefined,
      },
    });
    lane.setInviteCode("CODE");
    await lane.redeemAndSetup();
    assert.equal(lane.getView().status, "awaiting_sign_in");
  });
});
