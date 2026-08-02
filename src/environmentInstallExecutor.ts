import * as vscode from "vscode";
import type { EnvironmentInstallPlan } from "./environmentInstallPlan";
import type { InstallExecuteResult } from "./environmentLane";
import { runInIntegratedTerminal } from "./terminalRunner";

/**
 * 執行環境工具預設安裝計畫。
 * 不提權；權限／MDM 失敗原樣回傳錯誤。
 */
export async function executeEnvironmentInstallPlan(
  plan: EnvironmentInstallPlan,
): Promise<InstallExecuteResult> {
  try {
    if (plan.kind === "open-url") {
      const opened = await vscode.env.openExternal(vscode.Uri.parse(plan.commandOrUrl));
      if (!opened) {
        return {
          ok: false,
          detail: "無法開啟下載頁（可能被權限／MDM 阻擋）",
        };
      }
      return { ok: true };
    }

    const cwd =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ??
      process.env.USERPROFILE ??
      process.env.HOME ??
      ".";
    const exitCode = await runInIntegratedTerminal(cwd, plan.commandOrUrl);
    if (exitCode === undefined) {
      // 已送出但無法驗證：仍走「請重開終端」路徑，不假成功為就緒。
      return { ok: true };
    }
    if (exitCode !== 0) {
      return {
        ok: false,
        detail: `安裝命令失敗（結束碼 ${exitCode}）`,
      };
    }
    return { ok: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, detail: message };
  }
}

export function detectInstallPlatform(): "win32" | "darwin" {
  return process.platform === "darwin" ? "darwin" : "win32";
}

export async function confirmEnvironmentInstall(
  title: string,
  detail: string,
): Promise<boolean> {
  const pick = await vscode.window.showWarningMessage(
    title,
    { modal: true, detail },
    "執行",
  );
  return pick === "執行";
}
