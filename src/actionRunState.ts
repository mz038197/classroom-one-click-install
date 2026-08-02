export type ActionRunStatus =
  | "idle"
  | "running"
  | "succeeded"
  | "failed"
  | "unverified";

export type ActionRunSnapshot = {
  status: ActionRunStatus;
  detail?: string;
};

/** 依 Install Action id 記住執行狀態；真相在 extension host。 */
export class ActionRunStateStore {
  private readonly byId = new Map<string, ActionRunSnapshot>();

  get(actionId: string): ActionRunSnapshot {
    return this.byId.get(actionId) ?? { status: "idle" };
  }

  markRunning(actionId: string): void {
    this.byId.set(actionId, { status: "running" });
  }

  /** exitCode undefined = sendText 等無法驗證路徑（已送出／未驗證）。 */
  markFinished(
    actionId: string,
    exitCode: number | undefined,
    command?: string,
  ): void {
    if (exitCode === 0) {
      this.byId.set(actionId, { status: "succeeded" });
      return;
    }
    if (exitCode === undefined) {
      this.byId.set(actionId, {
        status: "unverified",
        detail: "已送出／未驗證（見終端機）",
      });
      return;
    }
    const detail = command?.includes("git+")
      ? "檢查 git／網路／repo 是否公開；詳見終端機"
      : "失敗（見終端機）";
    this.byId.set(actionId, { status: "failed", detail });
  }

  markFailed(actionId: string, detail: string): void {
    this.byId.set(actionId, { status: "failed", detail });
  }
}
