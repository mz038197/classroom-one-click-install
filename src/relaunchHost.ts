import { spawn, type ChildProcess, type SpawnOptions } from "node:child_process";

export type RelaunchHostPlan = {
  command: string;
  args: string[];
};

export type SpawnForRelaunch = (
  command: string,
  args: readonly string[],
  options: SpawnOptions,
) => ChildProcess;

const RELAUNCH_DELAY_SECONDS = 4;

function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/** PowerShell single-quoted string; `'` → `''`. */
function psSingleQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Build a delayed relaunch so a full quit can finish first (VS Code is
 * single-instance; spawning before quit often joins the dying process).
 *
 * ponytail: fixed 4s delay — enough for typical Stable quit on Windows;
 * upgrade to wait-for-lock-release if classroom machines shut down slower.
 */
export function buildRelaunchAfterQuitPlan(input: {
  platform: NodeJS.Platform;
  execPath: string;
  openPath?: string;
}): RelaunchHostPlan {
  const open = input.openPath?.trim() || undefined;

  if (input.platform === "win32") {
    const exe = psSingleQuote(input.execPath);
    const start = open
      ? `Start-Process -FilePath ${exe} -ArgumentList ${psSingleQuote(open)}`
      : `Start-Process -FilePath ${exe}`;
    return {
      command: "powershell.exe",
      args: [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        `Start-Sleep -Seconds ${RELAUNCH_DELAY_SECONDS}; ${start}`,
      ],
    };
  }

  const reopen = open
    ? `${shellSingleQuote(input.execPath)} ${shellSingleQuote(open)}`
    : shellSingleQuote(input.execPath);
  return {
    command: "/bin/sh",
    args: ["-c", `sleep ${RELAUNCH_DELAY_SECONDS}; exec ${reopen}`],
  };
}

/**
 * Detach a delayed relaunch process. Returns false if spawn fails synchronously
 * so the caller can refuse to quit (Host Full Restart hard promise).
 *
 * ponytail: async spawn `error` after return is not observed — cancel-quit
 * races remain accepted per product decision.
 */
export function scheduleRelaunchAfterQuit(
  plan: RelaunchHostPlan,
  spawnImpl: SpawnForRelaunch = spawn,
): boolean {
  try {
    const child = spawnImpl(plan.command, plan.args, {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    child.unref();
    return true;
  } catch {
    return false;
  }
}
