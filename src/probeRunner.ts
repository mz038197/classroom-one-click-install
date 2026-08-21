import { exec } from "node:child_process";
import { promisify } from "node:util";
import * as vscode from "vscode";
import type { ProbeRunner } from "./environmentLane";
import {
  buildProbeExecEnv,
  buildProbeHostCommand,
  environmentProbeCommands,
} from "./probePathEnv";
import {
  SHELL_INTEGRATION_WAIT_MS,
  stripAnsi,
  waitForShellIntegration,
} from "./terminalRunner";
import type { EnvironmentToolId, ProbeCommandResult } from "./toolProbe";

const execAsync = promisify(exec);
const ENV_CHECK_TERMINAL = "Classroom env check";
const COMMAND_TIMEOUT_MS = 15_000;

async function readWindowsMachineUserPath(): Promise<string | undefined> {
  try {
    const { stdout } = await execAsync(
      "powershell.exe -NoProfile -Command \"[Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')\"",
      {
        windowsHide: true,
        timeout: 8_000,
        maxBuffer: 1024 * 1024,
      },
    );
    const path = String(stdout ?? "").trim();
    return path.length > 0 ? path : undefined;
  } catch {
    return undefined;
  }
}

async function runHostProbe(
  command: string,
  windowsPath: string | undefined,
): Promise<ProbeCommandResult> {
  const env = buildProbeExecEnv({
    platform: process.platform,
    processEnv: process.env,
    windowsPath,
  });
  const hostCommand = buildProbeHostCommand({
    platform: process.platform,
    command,
    shell: process.env.SHELL,
  });
  try {
    const { stdout } = await execAsync(hostCommand, {
      windowsHide: true,
      timeout: COMMAND_TIMEOUT_MS,
      maxBuffer: 1024 * 1024,
      env,
    });
    return { exitCode: 0, stdout: String(stdout ?? "") };
  } catch (error: unknown) {
    const err = error as { code?: number | string; stdout?: string };
    const exitCode = typeof err.code === "number" ? err.code : 1;
    return { exitCode, stdout: String(err.stdout ?? "") };
  }
}

type ProbeSession = {
  terminal: vscode.Terminal;
  integration: vscode.TerminalShellIntegration;
  run: (command: string) => Promise<ProbeCommandResult>;
  dispose: () => void;
};

async function openProbeSession(): Promise<ProbeSession | undefined> {
  for (const terminal of vscode.window.terminals) {
    if (terminal.name === ENV_CHECK_TERMINAL) {
      terminal.dispose();
    }
  }
  const terminal = vscode.window.createTerminal({ name: ENV_CHECK_TERMINAL });
  // 新開整合終端以載入 shell profile／更新後的 PATH；不搶焦點。
  terminal.show(false);
  const integration = await waitForShellIntegration(
    terminal,
    SHELL_INTEGRATION_WAIT_MS,
  );
  if (!integration) {
    terminal.dispose();
    return undefined;
  }

  const run = async (command: string): Promise<ProbeCommandResult> => {
    const execution = integration.executeCommand(command);
    let stdout = "";
    const reading = (async () => {
      for await (const chunk of execution.read()) {
        stdout += chunk;
      }
    })();

    const exitCode = await new Promise<number | undefined>((resolve) => {
      let settled = false;
      let endSub: vscode.Disposable;
      let closeSub: vscode.Disposable;
      let timer: NodeJS.Timeout;
      const finish = (code: number | undefined): void => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        endSub.dispose();
        closeSub.dispose();
        resolve(code);
      };
      timer = setTimeout(() => finish(1), COMMAND_TIMEOUT_MS);
      endSub = vscode.window.onDidEndTerminalShellExecution((event) => {
        if (event.execution !== execution) {
          return;
        }
        finish(event.exitCode);
      });
      closeSub = vscode.window.onDidCloseTerminal((closed) => {
        if (closed !== terminal) {
          return;
        }
        finish(closed.exitStatus?.code ?? 1);
      });
    });

    await reading;
    return {
      exitCode: exitCode ?? 1,
      stdout: stripAnsi(stdout),
    };
  };

  return {
    terminal,
    integration,
    run,
    dispose: () => terminal.dispose(),
  };
}

function commandsFor(tool: EnvironmentToolId): string[] {
  return environmentProbeCommands(tool, process.platform);
}

/**
 * 主路徑：VS Code 整合終端探測（對齊「外部安裝 → 新終端可見 → 重新檢查」）。
 * 無 Shell Integration 時靜默 fallback：Windows 用 Machine+User PATH，
 * macOS/Linux 用登入殼 `-lc`；unix 指令含使用者 bin，nvm 只接在 Node 探測（見 ADR 0005、0008、0011）。
 */
export function createDefaultProbeRunner(): ProbeRunner {
  let session: ProbeSession | undefined;
  /** null = not loaded this recheck; undefined = read failed / non-Windows. */
  let windowsPathCache: string | undefined | null = null;

  return async (tool: EnvironmentToolId) => {
    // recheck 固定 uv→git→node；uv 時新開終端以取得新 PATH／profile。
    if (tool === "uv") {
      session?.dispose();
      session = await openProbeSession();
      windowsPathCache = null;
    }

    const hostRun = async (command: string): Promise<ProbeCommandResult> => {
      if (windowsPathCache === null && process.platform === "win32") {
        windowsPathCache = await readWindowsMachineUserPath();
      }
      const windowsPath =
        typeof windowsPathCache === "string" ? windowsPathCache : undefined;
      return runHostProbe(command, windowsPath);
    };

    const commands = commandsFor(tool);
    if (tool === "node") {
      const node = session
        ? await session.run(commands[0]!)
        : await hostRun(commands[0]!);
      const npm = session
        ? await session.run(commands[1]!)
        : await hostRun(commands[1]!);
      return { ...node, npm };
    }

    const command = commands[0]!;
    return session ? session.run(command) : hostRun(command);
  };
}
