import { spawn } from "node:child_process";

export type RelaunchHostPlan = {
  command: string;
  args: string[];
};

function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/**
 * Build a delayed relaunch so a full quit can finish first (VS Code is
 * single-instance; spawning before quit often joins the dying process).
 */
export function buildRelaunchAfterQuitPlan(input: {
  platform: NodeJS.Platform;
  execPath: string;
  openPath?: string;
  comSpec?: string;
}): RelaunchHostPlan {
  const open = input.openPath?.trim() || undefined;

  if (input.platform === "win32") {
    const exe = input.execPath.replace(/"/g, "");
    const folder = open ? ` "${open.replace(/"/g, "")}"` : "";
    return {
      command: input.comSpec || "cmd.exe",
      args: [
        "/d",
        "/s",
        "/c",
        `ping -n 2 127.0.0.1 >nul & start "" "${exe}"${folder}`,
      ],
    };
  }

  const reopen = open
    ? `${shellSingleQuote(input.execPath)} ${shellSingleQuote(open)}`
    : shellSingleQuote(input.execPath);
  return {
    command: "/bin/sh",
    args: ["-c", `sleep 1; exec ${reopen}`],
  };
}

export function scheduleRelaunchAfterQuit(plan: RelaunchHostPlan): void {
  const child = spawn(plan.command, plan.args, {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
}
