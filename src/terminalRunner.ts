import * as vscode from "vscode";

const TERMINAL_NAME = "Classroom install";
export const SHELL_INTEGRATION_WAIT_MS = 4000;

function createTerminalAtWorkspaceRoot(cwd: string): vscode.Terminal {
  // 既有 terminal 無法改 cwd；每次以工作區根目錄新建，避免命令跑錯目錄。
  for (const terminal of vscode.window.terminals) {
    if (terminal.name === TERMINAL_NAME) {
      terminal.dispose();
    }
  }
  return vscode.window.createTerminal({ name: TERMINAL_NAME, cwd });
}

export function stripAnsi(text: string): string {
  return text
    .replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, "")
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, "");
}

export async function waitForShellIntegration(
  terminal: vscode.Terminal,
  waitMs: number = SHELL_INTEGRATION_WAIT_MS,
): Promise<vscode.TerminalShellIntegration | undefined> {
  if (terminal.shellIntegration) {
    return terminal.shellIntegration;
  }
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      sub.dispose();
      resolve(terminal.shellIntegration);
    }, waitMs);
    const sub = vscode.window.onDidChangeTerminalShellIntegration((event) => {
      if (event.terminal !== terminal) {
        return;
      }
      clearTimeout(timer);
      sub.dispose();
      resolve(event.shellIntegration);
    });
  });
}

export type IntegratedTerminalRunResult = {
  exitCode: number | undefined;
  stdout: string;
};

/**
 * 主路徑：Shell Integration `executeCommand` + exit code／stdout。
 * 無整合時 fallback `sendText`，exitCode 為 undefined（結果未知）。
 */
export async function runInIntegratedTerminal(
  cwd: string,
  command: string,
): Promise<IntegratedTerminalRunResult> {
  const terminal = createTerminalAtWorkspaceRoot(cwd);
  terminal.show(true);

  const integration = await waitForShellIntegration(terminal);
  if (!integration) {
    terminal.sendText(command, true);
    return { exitCode: undefined, stdout: "" };
  }

  const execution = integration.executeCommand(command);
  let stdout = "";
  const reading = (async () => {
    for await (const chunk of execution.read()) {
      stdout += chunk;
    }
  })();

  const exitCode = await new Promise<number | undefined>((resolve) => {
    let settled = false;
    const finish = (code: number | undefined): void => {
      if (settled) {
        return;
      }
      settled = true;
      endSub.dispose();
      closeSub.dispose();
      resolve(code);
    };

    const endSub = vscode.window.onDidEndTerminalShellExecution((event) => {
      if (event.execution !== execution) {
        return;
      }
      finish(event.exitCode);
    });

    // `exit 1` 等會直接結束 shell process；此時未必收到 execution end，需靠關閉事件解卡住。
    const closeSub = vscode.window.onDidCloseTerminal((closed) => {
      if (closed !== terminal) {
        return;
      }
      finish(closed.exitStatus?.code ?? 1);
    });
  });

  await reading;
  return { exitCode, stdout: stripAnsi(stdout) };
}
