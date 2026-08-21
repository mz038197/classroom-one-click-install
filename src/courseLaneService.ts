import * as vscode from "vscode";
import { ActionRunStateStore } from "./actionRunState";
import { confirmThenRun } from "./confirmThenRun";
import { type InstallAction } from "./courseCatalog";
import { loadCourseCatalog } from "./courseCatalogLoad";
import {
  CATALOG_FILENAME,
  type CourseLaneView,
} from "./courseLaneTypes";
import { runInIntegratedTerminal } from "./terminalRunner";

export {
  CATALOG_FILENAME,
  type CourseLaneActionView,
  type CourseLaneView,
} from "./courseLaneTypes";

export type CourseLaneRemoteDeps = {
  getApiKey: () => Promise<string | undefined>;
  fetchRemoteYaml: (apiKey: string) => Promise<string>;
};

export class CourseLaneService {
  private readonly store = new ActionRunStateStore();
  private actions: InstallAction[] = [];
  private workspaceRoot: string | undefined;
  private loadError: { kind: "missing" | "invalid"; message: string } | undefined;
  private tip: string | undefined;
  private canRetryRemote = false;
  private source: "session" | "workspace" | undefined;
  private readonly onDidChangeEmitter = new vscode.EventEmitter<void>();
  readonly onDidChange = this.onDidChangeEmitter.event;

  constructor(private readonly remote?: CourseLaneRemoteDeps) {}

  getView(): CourseLaneView {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
      return { kind: "no-workspace" };
    }
    if (this.loadError?.kind === "missing") {
      return {
        kind: "missing",
        message: this.loadError.message,
        ...(this.tip ? { tip: this.tip } : {}),
        ...(this.canRetryRemote ? { canRetryRemote: true } : {}),
      };
    }
    if (this.loadError?.kind === "invalid") {
      return {
        kind: "invalid",
        message: this.loadError.message,
        ...(this.tip ? { tip: this.tip } : {}),
        ...(this.canRetryRemote ? { canRetryRemote: true } : {}),
      };
    }
    return {
      kind: "ready",
      workspaceRoot: this.workspaceRoot ?? folder.uri.fsPath,
      actions: this.actions.map((action) => ({
        ...action,
        run: this.store.get(action.id),
      })),
      ...(this.tip ? { tip: this.tip } : {}),
      ...(this.canRetryRemote ? { canRetryRemote: true } : {}),
      ...(this.source ? { source: this.source } : {}),
    };
  }

  async reload(): Promise<void> {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
      this.actions = [];
      this.workspaceRoot = undefined;
      this.loadError = undefined;
      this.tip = undefined;
      this.canRetryRemote = false;
      this.source = undefined;
      this.onDidChangeEmitter.fire();
      return;
    }

    this.workspaceRoot = folder.uri.fsPath;
    const apiKey = this.remote ? await this.remote.getApiKey() : undefined;
    const result = await loadCourseCatalog({
      apiKey,
      fetchRemoteYaml: this.remote
        ? (key) => this.remote!.fetchRemoteYaml(key)
        : async () => {
            throw new Error("no remote");
          },
      readWorkspaceYaml: async () => {
        const uri = vscode.Uri.joinPath(folder.uri, CATALOG_FILENAME);
        try {
          const bytes = await vscode.workspace.fs.readFile(uri);
          return Buffer.from(bytes).toString("utf8");
        } catch {
          return undefined;
        }
      },
    });

    if (!result.ok) {
      this.actions = [];
      this.loadError = { kind: result.kind, message: result.message };
      this.tip = result.tip;
      this.canRetryRemote = result.canRetryRemote;
      this.source = undefined;
      this.onDidChangeEmitter.fire();
      return;
    }

    this.actions = result.actions;
    this.loadError = undefined;
    this.tip = result.tip;
    this.canRetryRemote = result.canRetryRemote;
    this.source = result.source;
    this.onDidChangeEmitter.fire();
  }

  async runAction(actionId: string): Promise<void> {
    const action = this.actions.find((a) => a.id === actionId);
    const root = this.workspaceRoot;
    if (!action || !root) {
      void vscode.window.showErrorMessage("找不到此本課安裝動作或工作區。");
      return;
    }
    if (this.store.get(actionId).status === "running") {
      return;
    }

    await confirmThenRun(
      {
        confirm: async (command) => {
          const pick = await vscode.window.showWarningMessage(
            `安裝「${action.title}」\n\n將在工作區根目錄執行完整命令。`,
            { modal: true, detail: command },
            "執行",
          );
          return pick === "執行";
        },
        run: async (cwd, command) => {
          this.store.markRunning(actionId);
          this.onDidChangeEmitter.fire();
          try {
            const { exitCode } = await runInIntegratedTerminal(cwd, command);
            this.store.markFinished(actionId, exitCode, command);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.store.markFailed(actionId, `無法啟動終端機：${message}`);
            void vscode.window.showErrorMessage(`無法在終端機執行：${message}`);
          }
          this.onDidChangeEmitter.fire();
        },
      },
      action,
      root,
    );
  }

  dispose(): void {
    this.onDidChangeEmitter.dispose();
  }
}
