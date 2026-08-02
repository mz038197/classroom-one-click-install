import type { EnvironmentInstallPlan } from "./environmentInstallPlan";

export type InstallConfirmMode = "missing" | "ready" | "needs-reopen-terminal" | "failed";

export type EnvironmentInstallConfirm = {
  title: string;
  detail: string;
};

/** 確認框文案：揭示風險與將執行／開啟的內容。 */
export function buildEnvironmentInstallConfirm(
  plan: EnvironmentInstallPlan,
  mode: InstallConfirmMode,
): EnvironmentInstallConfirm {
  const title =
    mode === "ready" || mode === "needs-reopen-terminal"
      ? `重新安裝／修復 ${label(plan.tool)}`
      : `安裝 ${label(plan.tool)}`;

  const lines = [
    plan.summary,
    "",
    plan.kind === "shell" ? `將執行：\n${plan.commandOrUrl}` : `將開啟：\n${plan.commandOrUrl}`,
  ];
  if (plan.previewCommand) {
    lines.push("", `先檢視腳本（可選）：\n${plan.previewCommand}`);
  }
  lines.push("", "完成後請重開整合終端機，再按「重新檢查」。不會嘗試提權；若權限／MDM 阻擋請找 IT。");

  return { title, detail: lines.join("\n") };
}

function label(tool: EnvironmentInstallPlan["tool"]): string {
  if (tool === "node") {
    return "Node.js";
  }
  return tool;
}
