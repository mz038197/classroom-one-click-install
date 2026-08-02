export type ConfirmThenRunDeps = {
  confirm: (command: string) => Promise<boolean>;
  run: (cwd: string, command: string) => Promise<void>;
};

/** 每次執行前確認完整 command；取消則不呼叫 runner。 */
export async function confirmThenRun(
  deps: ConfirmThenRunDeps,
  action: { command: string },
  workspaceRoot: string,
): Promise<"cancelled" | "ran"> {
  const ok = await deps.confirm(action.command);
  if (!ok) {
    return "cancelled";
  }
  await deps.run(workspaceRoot, action.command);
  return "ran";
}
