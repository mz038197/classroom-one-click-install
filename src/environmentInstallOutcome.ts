import type { EnvironmentToolId } from "./toolProbe";
import type { InstallPlatform } from "./environmentInstallPlan";

export type ShellInstallExitInput = {
  tool: EnvironmentToolId;
  platform: InstallPlatform;
  exitCode: number | undefined;
  output: string;
};

export type ShellInstallExitResult =
  | { ok: true }
  | { ok: false; detail: string };

/** 將安裝命令結束碼解成成功或失敗。已裝好的明確訊號視同本次成功。 */
export function interpretShellInstallExit(
  input: ShellInstallExitInput,
): ShellInstallExitResult {
  if (input.exitCode === undefined || input.exitCode === 0) {
    return { ok: true };
  }
  if (
    input.tool === "git" &&
    input.platform === "darwin" &&
    /xcode-select:[\s\S]*already installed/i.test(input.output)
  ) {
    return { ok: true };
  }
  return {
    ok: false,
    detail: `安裝命令失敗（結束碼 ${input.exitCode}）`,
  };
}
