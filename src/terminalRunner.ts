import * as vscode from "vscode";

const TERMINAL_NAME = "Classroom install";
const SHELL_INTEGRATION_WAIT_MS = 4000;

function createTerminalAtWorkspaceRoot(cwd: string): vscode.Terminal {
  // 既有 terminal 無法改 cwd；每次以工作區根目錄新建，避免命令跑錯目錄。
  for (const terminal of vscode.window.terminals) {
    if (terminal.name === TERMINAL_NAME) {
      terminal.dispose();
    }
  }
  return vscode.window.createTerminal({ name: TERMINAL_NAME, cwd });
}

async function waitForShellIntegration(
  terminal: vscode.Terminal,
): Promise<vscode.TerminalShellIntegration | undefined> {
  if (terminal.shellIntegration) {
    return terminal.shellIntegration;
  }
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      sub.dispose();
      resolve(terminal.shellIntegration);
    }, SHELL_INTEGRATION_WAIT_MS);
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

/**
 * 主路徑：Shell Integration `executeCommand` + exit code。
 * 無整合時 fallback `sendText`，回傳 undefined（結果未知）。
 */
export async function runInIntegratedTerminal(
  cwd: string,
  command: string,
): Promise<number | undefined> {
  const terminal = createTerminalAtWorkspaceRoot(cwd);
  terminal.show(true);

  const integration = await waitForShellIntegration(terminal);
  if (!integration) {
    terminal.sendText(command, true);
    return undefined;
  }

  const execution = integration.executeCommand(command);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (exitCode: number | undefined): void => {
      if (settled) {
        return;
      }
      settled = true;
      endSub.dispose();
      closeSub.dispose();
      resolve(exitCode);
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
}
