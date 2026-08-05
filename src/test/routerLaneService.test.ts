import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CLASSROOM_CHAT_LM_SECRET_KEY } from "../hostLmSecret";
import { RouterLaneService } from "../routerLaneService";
import type { RouterPortalClient } from "../routerPortalClient";

const sampleToken =
  "n1:1:1700000000:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";

function baseOptions(overrides: Record<string, unknown> = {}) {
  const secrets = new Map<string, string>();
  return {
    secrets,
    options: {
      baseUrl: "https://ai.vanscoding.com",
      openExternal: async () => true,
      resolveUserDir: () => "/tmp/Code/User",
      uriScheme: "vscode",
      extensionId: "vans-coding.vans-classroom-install",
      secretStore: {
        get: async (k: string) => secrets.get(k),
        store: async (k: string, v: string) => {
          secrets.set(k, v);
        },
        delete: async (k: string) => {
          secrets.delete(k);
        },
      },
      ...overrides,
    },
  };
}

describe("RouterLaneService", () => {
  it("redeems with Host secret ref, writes Host secret, and asks for reload", async () => {
    let wroteKey = "";
    let hostPlaintext = "";
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

    const { secrets, options } = baseOptions({
      writeByok: async ({ apiKey }: { apiKey: string }) => {
        wroteKey = apiKey;
        return "/tmp/Code/User/chatLanguageModels.json";
      },
      writeHostSecret: async ({
        plaintext,
      }: {
        plaintext: string;
        extensionId: string;
      }) => {
        hostPlaintext = plaintext;
        return { hostStorageKey: "secret://chat.lm.secret.-7a55c1a5" };
      },
    });

    const lane = new RouterLaneService(client, options);
    lane.setInviteCode("ABC12345");
    const result = await lane.acceptHandoffInput(sampleToken);

    assert.equal(lane.getView().status, "ready");
    assert.equal(wroteKey, `\${input:${CLASSROOM_CHAT_LM_SECRET_KEY}}`);
    assert.equal(secrets.get("classroomApiKey"), "vcr_sk_testkey");
    assert.equal(secrets.get(CLASSROOM_CHAT_LM_SECRET_KEY), "vcr_sk_testkey");
    assert.equal(hostPlaintext, "vcr_sk_testkey");
    assert.equal(result.needsReload, true);
    assert.equal(lane.getView().canClear, true);
    assert.match(lane.getView().detail, /BYOK/);
  });

  it("blocks Cursor host without redeeming", async () => {
    let redeemed = false;
    const client: RouterPortalClient = {
      fetchChatLanguageModelsTemplate: async () => [],
      redeemWithHandoff: async () => {
        redeemed = true;
        throw new Error("should not redeem");
      },
    };
    const { options } = baseOptions({ uriScheme: "cursor" });
    const lane = new RouterLaneService(client, options);
    assert.equal(lane.getView().canOpenSignIn, false);
    assert.equal(lane.getView().canRedeem, false);
    await lane.redeemAndSetup();
    assert.equal(redeemed, false);
    assert.match(lane.getView().detail, /Cursor/);
  });

  it("clears classroom connection and resets to idle", async () => {
    let cleared = false;
    const client: RouterPortalClient = {
      fetchChatLanguageModelsTemplate: async () => [],
      redeemWithHandoff: async () => {
        throw new Error("unused");
      },
    };
    const { secrets, options } = baseOptions({
      clearByok: async () => {
        cleared = true;
        secrets.delete("classroomApiKey");
        return { modelsPath: "/tmp/Code/User/chatLanguageModels.json" };
      },
    });
    secrets.set("classroomApiKey", "vcr_sk_x");
    const lane = new RouterLaneService(client, options);
    await lane.restoreFromSecrets();
    assert.equal(lane.getView().status, "ready");
    assert.equal(lane.getView().canClear, true);

    const result = await lane.clearClassroomConnection();
    assert.equal(cleared, true);
    assert.equal(lane.getView().status, "idle");
    assert.equal(lane.getView().canClear, false);
    assert.equal(result.needsReload, true);
  });

  it("asks for sign-in when redeeming without handoff", async () => {
    const client: RouterPortalClient = {
      fetchChatLanguageModelsTemplate: async () => [],
      redeemWithHandoff: async () => {
        throw new Error("should not redeem");
      },
    };
    const { options } = baseOptions();
    const lane = new RouterLaneService(client, options);
    lane.setInviteCode("CODE");
    await lane.redeemAndSetup();
    assert.equal(lane.getView().status, "awaiting_sign_in");
  });
});
