export type ToolReadiness = {
  uv: boolean;
  git: boolean;
  node: boolean;
};

/** 依缺 uv／git 回傳禁用原因；Node 從不鎖定本課動作。Toolchain Ready 不是總開關。 */
export function disabledReasonForAction(
  command: string,
  tools: ToolReadiness,
): string | undefined {
  const trimmed = command.trim();
  const needsUv = /^(uv|uvx)(\s|$)/.test(trimmed);
  if (needsUv && !tools.uv) {
    return "需要先就緒 uv（見環境工具）";
  }

  const needsGit = /\bgit\+/.test(trimmed) || /^git(\s|$)/.test(trimmed);
  if (needsGit && !tools.git) {
    return "需要先就緒 git（見環境工具）";
  }

  return undefined;
}
