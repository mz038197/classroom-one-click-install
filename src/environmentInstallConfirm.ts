import type { EnvironmentInstallPlan } from "./environmentInstallPlan";

export type InstallConfirmMode = "missing" | "ready" | "needs-reopen-terminal" | "failed";

export type EnvironmentInstallConfirm = {
  title: string;
  detail: string;
};

export type EnvironmentInstallConfirmItem = {
  plan: EnvironmentInstallPlan;
  mode: InstallConfirmMode;
};

export const BATCH_INSTALL_CONFIRM_TITLE = "安裝所選環境工具";

/** 確認框文案：一批計畫、一次標題，揭示將執行／開啟的內容。 */
export function buildEnvironmentInstallConfirm(
  items: readonly EnvironmentInstallConfirmItem[],
): EnvironmentInstallConfirm {
  const blocks = items.map(({ plan, mode }) => {
    const repair =
      mode === "ready" || mode === "needs-reopen-terminal"
        ? "（重新安裝／修復）"
        : "";
    const action =
      plan.kind === "shell"
        ? `將執行：\n${plan.commandOrUrl}`
        : `將開啟：\n${plan.commandOrUrl}`;
    const lines = [`${label(plan.tool)}${repair}`, plan.summary, action];
    if (plan.previewCommand) {
      lines.push(`先檢視腳本（可選）：\n${plan.previewCommand}`);
    }
    return lines.join("\n");
  });

  return {
    title: BATCH_INSTALL_CONFIRM_TITLE,
    detail: [
      ...blocks,
      "完成後請重開整合終端機，再按「重新檢查」。不會嘗試提權；若權限／MDM 阻擋請找 IT。",
    ].join("\n\n"),
  };
}

function label(tool: EnvironmentInstallPlan["tool"]): string {
  if (tool === "node") {
    return "Node.js";
  }
  if (tool === "pwsh") {
    return "PowerShell 7";
  }
  return tool;
}
