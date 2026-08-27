import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CLASSROOM_CHAT_LM_SECRET_KEY } from "../hostLmSecret";
import { RouterLaneService } from "../routerLaneService";
import type { RouterPortalClient } from "../routerPortalClient";

const sampleToken =
  "n1:1:1700000000:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";

function stubClient(
  overrides: Partial<RouterPortalClient> = {},
): RouterPortalClient {
  return {
    fetchCourseCatalogYaml: async () => "actions: []\n",
    fetchChatLanguageModelsTemplate: async () => [],
    redeemWithHandoff: async () => {
      throw new Error("unused");
    },
    redeemWithNickname: async () => {
      throw new Error("unused");
    },
    ...overrides,
  };
}

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

function byokOptions(overrides: Record<string, unknown> = {}) {
  return baseOptions({
    writeByok: async () => "/tmp/Code/User/chatLanguageModels.json",
    writeHostSecret: async () => ({
      hostStorageKey: "secret://chat.lm.secret.-7a55c1a5",
    }),
    ...overrides,
  });
}

describe("RouterLaneService", () => {
  it("idle Vans VS Code shows nickname connect and hides paste UI", () => {
    const { options } = baseOptions();
    const lane = new RouterLaneService(stubClient(), options);
    assert.equal(lane.getView().showNicknameField, true);
    assert.equal(lane.getView().showPasteUi, false);
    assert.equal(lane.getView().canNicknameRedeem, false);
    assert.equal(lane.getView().canOpenSignIn, false);
    assert.match(lane.getView().detail, /連線/);
    assert.doesNotMatch(lane.getView().detail, /連線登入/);

    lane.setInviteCode("ABC12345");
    assert.equal(lane.getView().canNicknameRedeem, false);
    assert.equal(lane.getView().canOpenSignIn, true);
    assert.equal(lane.getView().showPasteUi, false);

    lane.setNickname("Ada");
    assert.equal(lane.getView().canNicknameRedeem, true);
    assert.equal(lane.getView().nickname, "Ada");
    assert.equal(lane.getView().showPasteUi, false);
  });

  it("連線 Nickname Redeems then BYOK and reaches ready with Class Label", async () => {
    let wroteKey = "";
    let hostPlaintext = "";
    let storedLabel: string | undefined;
    const client = stubClient({
      fetchChatLanguageModelsTemplate: async () => [
        { name: "VCRouter", vendor: "customendpoint", apiKey: "", models: [] },
      ],
      redeemWithNickname: async (invite, nickname) => {
        assert.equal(invite, "ABC12345");
        assert.equal(nickname, "Ada");
        return {
          api_key: "vcr_sk_nick",
          session: {
            invite_code: invite,
            class_name: "Demo",
            name: "Week 1",
            expires_at: "2099-01-01T00:00:00Z",
          },
        };
      },
    });
    const { secrets, options } = byokOptions({
      writeByok: async ({ apiKey }: { apiKey: string }) => {
        wroteKey = apiKey;
        return "/tmp/Code/User/chatLanguageModels.json";
      },
      writeHostSecret: async ({ plaintext }: { plaintext: string }) => {
        hostPlaintext = plaintext;
        return { hostStorageKey: "secret://chat.lm.secret.-7a55c1a5" };
      },
      classLabelStore: {
        get: async () => storedLabel,
        set: async (label: string) => {
          storedLabel = label;
        },
        clear: async () => {
          storedLabel = undefined;
        },
      },
    });
    const lane = new RouterLaneService(client, options);
    lane.setInviteCode("ABC12345");
    lane.setNickname(" Ada ");
    const result = await lane.nicknameRedeemAndSetup();

    assert.equal(lane.getView().status, "ready");
    assert.equal(lane.getView().classLabel, "Demo · Week 1");
    assert.equal(storedLabel, "Demo · Week 1");
    assert.equal(wroteKey, `\${input:${CLASSROOM_CHAT_LM_SECRET_KEY}}`);
    assert.equal(secrets.get("classroomApiKey"), "vcr_sk_nick");
    assert.equal(hostPlaintext, "vcr_sk_nick");
    assert.equal(result.needsReload, true);
    assert.equal(lane.getView().canCopyApiKey, true);
    assert.equal(lane.getView().canClear, true);
    assert.equal(lane.getView().canNicknameRedeem, false);
    assert.equal(lane.getView().detail, "Classroom API Key 已設定。");
  });

  it("does not show paste UI after a Nickname Redeem error", async () => {
    const client = stubClient({
      fetchChatLanguageModelsTemplate: async () => [
        { name: "VCRouter", vendor: "customendpoint", apiKey: "", models: [] },
      ],
      redeemWithNickname: async () => {
        throw new Error("此課堂座位已滿，無法以新暱稱領取");
      },
    });
    const { options } = byokOptions();
    const lane = new RouterLaneService(client, options);
    lane.setInviteCode("ABC12345");
    lane.setNickname("Ada");
    await lane.nicknameRedeemAndSetup();
    assert.equal(lane.getView().status, "error");
    assert.equal(lane.getView().showPasteUi, false);
    assert.equal(lane.getView().canNicknameRedeem, true);
    assert.match(lane.getView().detail, /座位已滿/);
  });

  it("does not Nickname Redeem without invite or nickname", async () => {
    let called = false;
    const client = stubClient({
      redeemWithNickname: async () => {
        called = true;
        throw new Error("should not redeem");
      },
    });
    const { options } = baseOptions();
    const lane = new RouterLaneService(client, options);
    await lane.nicknameRedeemAndSetup();
    assert.equal(called, false);
    assert.equal(lane.getView().status, "idle");
    assert.match(lane.getView().detail, /邀請碼|暱稱/);

    lane.setInviteCode("ABC12345");
    await lane.nicknameRedeemAndSetup();
    assert.equal(called, false);
    assert.match(lane.getView().detail, /暱稱/);
  });

  it("blocks Cursor host without Nickname Redeem", async () => {
    let nicknameRedeemed = false;
    const client = stubClient({
      redeemWithNickname: async () => {
        nicknameRedeemed = true;
        throw new Error("should not redeem");
      },
    });
    const { options } = baseOptions({ uriScheme: "cursor" });
    const lane = new RouterLaneService(client, options);
    assert.equal(lane.getView().showNicknameField, false);
    assert.equal(lane.getView().canNicknameRedeem, false);
    lane.setInviteCode("ABC");
    lane.setNickname("Ada");
    await lane.nicknameRedeemAndSetup();
    assert.equal(nicknameRedeemed, false);
    assert.match(lane.getView().detail, /Cursor/);
  });

  it("keeps Google as secondary and shows paste UI only after 使用 Google 登入", async () => {
    let opened = false;
    const { options } = baseOptions({
      openExternal: async () => {
        opened = true;
        return true;
      },
    });
    const lane = new RouterLaneService(stubClient(), options);
    lane.setInviteCode("ABC12345");
    lane.setNickname("Ada");
    assert.equal(lane.getView().showPasteUi, false);
    assert.equal(lane.getView().canOpenSignIn, true);

    await lane.openGoogleSignIn();
    assert.equal(opened, true);
    assert.equal(lane.getView().status, "awaiting_sign_in");
    assert.equal(lane.getView().showPasteUi, true);
    assert.equal(lane.getView().canRedeem, true);
    assert.equal(lane.getView().nickname, "Ada");
  });

  it("redeems with Host secret ref, writes Host secret, and asks for reload", async () => {
    let wroteKey = "";
    let hostPlaintext = "";
    const client = stubClient({
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
    });

    const { secrets, options } = byokOptions({
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
    assert.equal(lane.getView().canCopyApiKey, true);
    assert.equal(lane.getView().detail, "Classroom API Key 已設定。");
    assert.doesNotMatch(lane.getView().detail, /BYOK|vcr_sk_/);
  });

  it("blocks Cursor host without redeeming", async () => {
    let redeemed = false;
    const client = stubClient({
      redeemWithHandoff: async () => {
        redeemed = true;
        throw new Error("should not redeem");
      },
    });
    const { options } = baseOptions({ uriScheme: "cursor" });
    const lane = new RouterLaneService(client, options);
    assert.equal(lane.getView().canOpenSignIn, false);
    assert.equal(lane.getView().canRedeem, false);
    await lane.redeemAndSetup();
    assert.equal(redeemed, false);
    assert.match(lane.getView().detail, /Cursor/);
  });

  it("restores ready detail without exposing Classroom API Key prefix", async () => {
    const { secrets, options } = baseOptions();
    secrets.set("classroomApiKey", "vcr_sk_7053fdeadbeef");
    const lane = new RouterLaneService(stubClient(), options);
    await lane.restoreFromSecrets();
    assert.equal(lane.getView().status, "ready");
    assert.equal(lane.getView().detail, "Classroom API Key 已設定。");
    assert.equal(lane.getView().canCopyApiKey, true);
    assert.doesNotMatch(lane.getView().detail, /vcr_sk_/);
  });

  it("persists Class Label on redeem and restores it with the key", async () => {
    let storedLabel: string | undefined;
    const client = stubClient({
      fetchChatLanguageModelsTemplate: async () => [
        { name: "VCRouter", vendor: "customendpoint", apiKey: "", models: [] },
      ],
      redeemWithHandoff: async () => ({
        api_key: "vcr_sk_label",
        session: {
          class_name: "馬公高中專題課",
          name: "特別保留",
        },
      }),
    });
    const { options } = byokOptions({
      classLabelStore: {
        get: async () => storedLabel,
        set: async (label: string) => {
          storedLabel = label;
        },
        clear: async () => {
          storedLabel = undefined;
        },
      },
    });
    const lane = new RouterLaneService(client, options);
    lane.setInviteCode("ABC12345");
    await lane.acceptHandoffInput(sampleToken);
    assert.equal(lane.getView().classLabel, "馬公高中專題課 · 特別保留");
    assert.equal(storedLabel, "馬公高中專題課 · 特別保留");

    const { secrets, options: restoreOpts } = baseOptions({
      classLabelStore: {
        get: async () => storedLabel,
        set: async (label: string) => {
          storedLabel = label;
        },
        clear: async () => {
          storedLabel = undefined;
        },
      },
    });
    secrets.set("classroomApiKey", "vcr_sk_label");
    const restored = new RouterLaneService(client, restoreOpts);
    await restored.restoreFromSecrets();
    assert.equal(restored.getView().status, "ready");
    assert.equal(restored.getView().classLabel, "馬公高中專題課 · 特別保留");
  });

  it("clears persisted Class Label with Clear Classroom Connection", async () => {
    let storedLabel: string | undefined = "Demo · Week 1";
    const { secrets, options } = baseOptions({
      clearByok: async () => {
        secrets.delete("classroomApiKey");
        return { modelsPath: "/tmp/Code/User/chatLanguageModels.json" };
      },
      classLabelStore: {
        get: async () => storedLabel,
        set: async (label: string) => {
          storedLabel = label;
        },
        clear: async () => {
          storedLabel = undefined;
        },
      },
    });
    secrets.set("classroomApiKey", "vcr_sk_x");
    const lane = new RouterLaneService(stubClient(), options);
    await lane.restoreFromSecrets();
    assert.equal(lane.getView().classLabel, "Demo · Week 1");

    await lane.clearClassroomConnection();
    assert.equal(lane.getView().classLabel, undefined);
    assert.equal(storedLabel, undefined);
  });

  it("prompts for 連線登入 when redeeming without handoff", async () => {
    const { options } = baseOptions();
    const lane = new RouterLaneService(stubClient(), options);
    lane.setInviteCode("CODE");
    await lane.redeemAndSetup();
    assert.equal(lane.getView().status, "awaiting_sign_in");
    assert.match(lane.getView().detail, /連線登入/);
    assert.doesNotMatch(lane.getView().detail, /登入 Google/);
  });

  it("does not allow 連線登入 without Invite Code", async () => {
    let opened = false;
    const { options } = baseOptions({
      openExternal: async () => {
        opened = true;
        return true;
      },
    });
    const lane = new RouterLaneService(stubClient(), options);
    assert.equal(lane.getView().canOpenSignIn, false);
    assert.equal(lane.getView().showPasteUi, false);
    await lane.openGoogleSignIn();
    assert.equal(opened, false);
    assert.equal(lane.getView().status, "idle");
    assert.match(lane.getView().detail, /邀請碼/);
    assert.match(lane.getView().detail, /使用 Google 登入/);
    assert.doesNotMatch(lane.getView().detail, /連線登入/);
  });

  it("enables 連線登入 only after Invite Code and hides paste UI until awaiting", async () => {
    const { options } = baseOptions();
    const lane = new RouterLaneService(stubClient(), options);
    lane.setInviteCode("ABC12345");
    assert.equal(lane.getView().canOpenSignIn, true);
    assert.equal(lane.getView().showPasteUi, false);
    assert.equal(lane.getView().canRedeem, false);

    await lane.openGoogleSignIn();
    assert.equal(lane.getView().status, "awaiting_sign_in");
    assert.equal(lane.getView().showPasteUi, true);
    assert.equal(lane.getView().canRedeem, true);
    assert.equal(lane.getView().canOpenSignIn, true);
  });

  it("clears pending handoff when 重新連線登入", async () => {
    let openCount = 0;
    const { options } = baseOptions({
      openExternal: async () => {
        openCount += 1;
        return true;
      },
    });
    const lane = new RouterLaneService(stubClient(), options);
    lane.setInviteCode("CODE");
    lane.setInviteCode("");
    await lane.acceptHandoffInput(sampleToken);
    assert.equal(lane.getView().status, "awaiting_sign_in");
    lane.setInviteCode("CODE");
    await lane.openGoogleSignIn();
    assert.equal(openCount, 1);
    await lane.redeemAndSetup();
    assert.equal(lane.getView().status, "awaiting_sign_in");
    assert.match(lane.getView().detail, /連線登入|貼碼|Sign-in Handoff/);
  });

  it("clears classroom connection and resets to idle", async () => {
    let cleared = false;
    const { secrets, options } = baseOptions({
      clearByok: async () => {
        cleared = true;
        secrets.delete("classroomApiKey");
        return { modelsPath: "/tmp/Code/User/chatLanguageModels.json" };
      },
    });
    secrets.set("classroomApiKey", "vcr_sk_x");
    const lane = new RouterLaneService(stubClient(), options);
    await lane.restoreFromSecrets();
    assert.equal(lane.getView().status, "ready");
    assert.equal(lane.getView().canClear, true);
    assert.equal(lane.getView().canCopyApiKey, true);

    const result = await lane.clearClassroomConnection();
    assert.equal(cleared, true);
    assert.equal(lane.getView().status, "idle");
    assert.equal(lane.getView().canClear, false);
    assert.equal(lane.getView().canCopyApiKey, false);
    assert.equal(lane.getView().nickname, "");
    assert.equal(result.needsReload, true);
  });

  it("maps Host DB busy on clear to student copy and offerRestart", async () => {
    const { secrets, options } = baseOptions({
      clearByok: async () => {
        throw new Error("database is locked");
      },
    });
    secrets.set("classroomApiKey", "vcr_sk_x");
    const lane = new RouterLaneService(stubClient(), options);
    await lane.restoreFromSecrets();

    const result = await lane.clearClassroomConnection();
    assert.equal(result.needsReload, false);
    assert.equal(result.offerRestart, true);
    assert.equal(lane.getView().status, "error");
    assert.match(lane.getView().detail, /本機忙碌/);
    assert.doesNotMatch(lane.getView().detail, /database is locked/i);
  });

  it("Copy Classroom API Key and Clear still work after Nickname Redeem", async () => {
    let storedLabel: string | undefined;
    const client = stubClient({
      fetchChatLanguageModelsTemplate: async () => [
        { name: "VCRouter", vendor: "customendpoint", apiKey: "", models: [] },
      ],
      redeemWithNickname: async () => ({
        api_key: "vcr_sk_after",
        session: { class_name: "Demo", name: "Week 1" },
      }),
    });
    const { secrets, options } = byokOptions({
      clearByok: async () => {
        secrets.delete("classroomApiKey");
        return { modelsPath: "/tmp/Code/User/chatLanguageModels.json" };
      },
      classLabelStore: {
        get: async () => storedLabel,
        set: async (label: string) => {
          storedLabel = label;
        },
        clear: async () => {
          storedLabel = undefined;
        },
      },
    });
    const lane = new RouterLaneService(client, options);
    lane.setInviteCode("ABC12345");
    lane.setNickname("Ada");
    await lane.nicknameRedeemAndSetup();
    assert.equal(lane.getView().canCopyApiKey, true);
    assert.equal(lane.getView().canClear, true);
    assert.equal(secrets.get("classroomApiKey"), "vcr_sk_after");

    await lane.clearClassroomConnection();
    assert.equal(lane.getView().status, "idle");
    assert.equal(lane.getView().canCopyApiKey, false);
    assert.equal(lane.getView().classLabel, undefined);
    assert.equal(storedLabel, undefined);
  });

  it("Pegasi path keeps Google-first idle when Nickname Redeem is off", () => {
    const { options } = baseOptions({ enableNicknameRedeem: false });
    const lane = new RouterLaneService(stubClient(), options);
    assert.equal(lane.getView().showNicknameField, false);
    assert.equal(lane.getView().canNicknameRedeem, false);
    assert.equal(lane.getView().showPasteUi, false);
    assert.match(lane.getView().detail, /連線登入/);
    lane.setInviteCode("ABC12345");
    assert.equal(lane.getView().canOpenSignIn, true);
    assert.equal(lane.getView().canNicknameRedeem, false);
  });
});
