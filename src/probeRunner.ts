import { exec } from "node:child_process";
import { promisify } from "node:util";
import * as vscode from "vscode";
import type { ProbeRunner } from "./environmentLane";
import { waitForShellIntegration } from "./terminalRunner";
import type { EnvironmentToolId, ProbeCommandResult } from "./toolProbe";

const execAsync = promisify(exec);
const ENV_CHECK_TERMINAL = "Classroom env check";
const COMMAND_TIMEOUT_MS = 15_000;

async function runHostShell(command: string): Promise<ProbeCommandResult> {
  try {
    const { stdout } = await execAsync(command, {
      windowsHide: true,
      timeout: COMMAND_TIMEOUT_MS,
      maxBuffer: 1024 * 1024,
    });
    return { exitCode: 0, stdout: String(stdout ?? "") };
  } catch (error: unknown) {
    const err = error as { code?: number | string; stdout?: string };
    const exitCode = typeof err.code === "number" ? err.code : 1;
    return { exitCode, stdout: String(err.stdout ?? "") };
  }
}

function stripAnsi(text: string): string {
  return text
    .replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, "")
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, "");
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
  const integration = await waitForShellIntegration(terminal);
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
  if (tool === "uv") {
    return ["uv --version"];
  }
  if (tool === "git") {
    return ["git --version"];
  }
  return ["node --version", "npm --version"];
}

/**
 * 主路徑：新開整合終端探測（對齊「外部安裝 → 新終端可見 → 重新檢查」）。
 * 無 Shell Integration 時 fallback 至 extension host shell。
 */
export function createDefaultProbeRunner(): ProbeRunner {
  let session: ProbeSession | undefined;
  let hostFallbackNoticeShown = false;

  return async (tool: EnvironmentToolId) => {
    // recheck 固定 uv→git→node；uv 時新開終端以取得新 PATH／profile。
    if (tool === "uv") {
      session?.dispose();
      session = await openProbeSession();
      if (!session && !hostFallbackNoticeShown) {
        hostFallbackNoticeShown = true;
        void vscode.window.showWarningMessage(
          "無法在整合終端探測環境工具，已改用編輯器行程 PATH；若剛外部安裝，請重開視窗後再重新檢查。",
        );
      }
    }

    const commands = commandsFor(tool);
    if (tool === "node") {
      const node = session
        ? await session.run(commands[0]!)
        : await runHostShell(commands[0]!);
      const npm = session
        ? await session.run(commands[1]!)
        : await runHostShell(commands[1]!);
      return { ...node, npm };
    }

    const command = commands[0]!;
    return session ? session.run(command) : runHostShell(command);
  };
}
