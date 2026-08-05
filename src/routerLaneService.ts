import { EventEmitter } from "node:events";
import type { ChatLanguageModelProvider } from "./byokSetup";
import type { RouterPortalClient } from "./routerPortalClient";
import { parseHandoffToken } from "./routerHandoffUri";
import { writeByokFile } from "./writeByokFile";

export type RouterLaneStatus =
  | "idle"
  | "awaiting_sign_in"
  | "busy"
  | "ready"
  | "error";

export type RouterLaneView = {
  status: RouterLaneStatus;
  inviteCode: string;
  detail: string;
  classLabel?: string;
  expiresAt?: string;
  canRedeem: boolean;
  canOpenSignIn: boolean;
};

type OpenExternal = (url: string) => Thenable<boolean>;

export class RouterLaneService {
  private readonly emitter = new EventEmitter();
  private inviteCode = "";
  private pendingHandoff: string | undefined;
  private status: RouterLaneStatus = "idle";
  private detail = "輸入邀請碼後登入 Google，即可兌換並完成 BYOK 設定。";
  private classLabel?: string;
  private expiresAt?: string;
  private lastApiKeyPrefix?: string;

  constructor(
    private readonly client: RouterPortalClient,
    private readonly options: {
      baseUrl: string;
      openExternal: OpenExternal;
      resolveUserDir: () => string;
      secretStore: {
        get: (key: string) => Thenable<string | undefined>;
        store: (key: string, value: string) => Thenable<void>;
      };
      apiKeySecretKey?: string;
      writeByok?: (args: {
        userDir: string;
        template: ChatLanguageModelProvider[];
        apiKey: string;
      }) => Promise<string>;
    },
  ) {}

  onDidChange(listener: () => void): { dispose: () => void } {
    this.emitter.on("change", listener);
    return { dispose: () => this.emitter.off("change", listener) };
  }

  getView(): RouterLaneView {
    const busy = this.status === "busy";
    return {
      status: this.status,
      inviteCode: this.inviteCode,
      detail: this.detail,
      ...(this.classLabel ? { classLabel: this.classLabel } : {}),
      ...(this.expiresAt ? { expiresAt: this.expiresAt } : {}),
      canRedeem: !busy && !!this.inviteCode.trim(),
      canOpenSignIn: !busy,
    };
  }

  setInviteCode(code: string): void {
    this.inviteCode = code;
    this.emit();
  }

  async openGoogleSignIn(): Promise<void> {
    const url = `${this.options.baseUrl.replace(/\/+$/, "")}/auth/google/login?client=extension`;
    this.status = "awaiting_sign_in";
    this.detail = "已開啟瀏覽器，請完成 Google 登入。若編輯器未自動回來，請貼上一次性貼碼。";
    this.emit();
    await this.options.openExternal(url);
  }

  /** Called from UriHandler or paste-code UI. */
  async acceptHandoffInput(raw: string): Promise<void> {
    const token = parseHandoffToken(raw);
    if (!token) {
      this.status = "error";
      this.detail = "無法辨識 Sign-in Handoff，請重新登入或貼上完整一次性貼碼。";
      this.emit();
      return;
    }
    this.pendingHandoff = token;
    if (!this.inviteCode.trim()) {
      this.status = "awaiting_sign_in";
      this.detail = "已收到登入證明。請輸入邀請碼後按「兌換並設定」。";
      this.emit();
      return;
    }
    await this.redeemAndSetup();
  }

  async redeemAndSetup(): Promise<void> {
    const invite = this.inviteCode.trim();
    if (!invite) {
      this.status = "error";
      this.detail = "請先輸入邀請碼。";
      this.emit();
      return;
    }
    if (!this.pendingHandoff) {
      this.status = "awaiting_sign_in";
      this.detail = "請先按「登入 Google」完成 Sign-in Handoff。";
      this.emit();
      return;
    }

    this.status = "busy";
    this.detail = "兌換中…";
    this.emit();

    const handoff = this.pendingHandoff;
    try {
      // Fetch template before redeem so a template failure does not burn the handoff.
      const template = await this.client.fetchChatLanguageModelsTemplate();
      const redeemed = await this.client.redeemWithHandoff(handoff, invite);
      this.pendingHandoff = undefined;
      const write = this.options.writeByok ?? writeByokFile;
      const target = await write({
        userDir: this.options.resolveUserDir(),
        template,
        apiKey: redeemed.api_key,
      });
      const secretKey = this.options.apiKeySecretKey ?? "classroomApiKey";
      await this.options.secretStore.store(secretKey, redeemed.api_key);
      this.lastApiKeyPrefix = redeemed.api_key.slice(0, 12);
      this.classLabel =
        [redeemed.session.class_name, redeemed.session.name].filter(Boolean).join(" · ") ||
        undefined;
      this.expiresAt = redeemed.session.expires_at;
      this.status = "ready";
      this.detail = `已完成 BYOK 設定（${target}）。請重載視窗後選 VCRouter 模型。`;
      this.emit();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.status = "error";
      this.detail = message;
      this.emit();
    }
  }

  async restoreFromSecrets(): Promise<void> {
    const secretKey = this.options.apiKeySecretKey ?? "classroomApiKey";
    const key = await this.options.secretStore.get(secretKey);
    if (key?.startsWith("vcr_sk_")) {
      this.lastApiKeyPrefix = key.slice(0, 12);
      if (this.status === "idle") {
        this.status = "ready";
        this.detail = `本機已有 Classroom API Key（${this.lastApiKeyPrefix}…）。換新邀請碼請再跑一次流程。`;
        this.emit();
      }
    }
  }

  private emit(): void {
    this.emitter.emit("change");
  }
}
