import * as vscode from "vscode";
import { ActionRunStateStore, type ActionRunSnapshot } from "./actionRunState";
import {
  disabledReasonForAction,
  type ToolReadiness,
} from "./actionDependencyGate";
import { confirmThenRun } from "./confirmThenRun";
import {
  parseCourseCatalog,
  type InstallAction,
} from "./courseCatalog";
import { runInIntegratedTerminal } from "./terminalRunner";

export const CATALOG_FILENAME = "classroom-installs.yaml";

export type CourseLaneActionView = InstallAction & {
  run: ActionRunSnapshot;
  disabledReason?: string;
};

export type CourseLaneView =
  | { kind: "no-workspace" }
  | { kind: "missing"; message: string }
  | { kind: "invalid"; message: string }
  | {
      kind: "ready";
      workspaceRoot: string;
      actions: CourseLaneActionView[];
    };

export type ReadinessProvider = () => ToolReadiness;

const ALL_READY: ToolReadiness = { uv: true, git: true, node: true };

export class CourseLaneService {
  private readonly store = new ActionRunStateStore();
  private actions: InstallAction[] = [];
  private workspaceRoot: string | undefined;
  private loadError: { kind: "missing" | "invalid"; message: string } | undefined;
  private readonly onDidChangeEmitter = new vscode.EventEmitter<void>();
  readonly onDidChange = this.onDidChangeEmitter.event;

  constructor(private readonly readiness: ReadinessProvider = () => ALL_READY) {}

  getView(): CourseLaneView {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
      return { kind: "no-workspace" };
    }
    if (this.loadError?.kind === "missing") {
      return { kind: "missing", message: this.loadError.message };
    }
    if (this.loadError?.kind === "invalid") {
      return { kind: "invalid", message: this.loadError.message };
    }
    const tools = this.readiness();
    return {
      kind: "ready",
      workspaceRoot: this.workspaceRoot ?? folder.uri.fsPath,
      actions: this.actions.map((action) => {
        const disabledReason = disabledReasonForAction(action.command, tools);
        return {
          ...action,
          run: this.store.get(action.id),
          ...(disabledReason ? { disabledReason } : {}),
        };
      }),
    };
  }

  async reload(): Promise<void> {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
      this.actions = [];
      this.workspaceRoot = undefined;
      this.loadError = undefined;
      this.onDidChangeEmitter.fire();
      return;
    }

    this.workspaceRoot = folder.uri.fsPath;
    const uri = vscode.Uri.joinPath(folder.uri, CATALOG_FILENAME);
    let bytes: Uint8Array;
    try {
      bytes = await vscode.workspace.fs.readFile(uri);
    } catch {
      this.actions = [];
      this.loadError = {
        kind: "missing",
        message: `找不到 ${CATALOG_FILENAME}`,
      };
      this.onDidChangeEmitter.fire();
      return;
    }

    const parsed = parseCourseCatalog(Buffer.from(bytes).toString("utf8"));
    if (!parsed.ok) {
      this.actions = [];
      this.loadError = { kind: "invalid", message: parsed.error };
      this.onDidChangeEmitter.fire();
      return;
    }

    this.actions = parsed.actions;
    this.loadError = undefined;
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
    const disabledReason = disabledReasonForAction(action.command, this.readiness());
    if (disabledReason) {
      void vscode.window.showWarningMessage(disabledReason);
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
            const exitCode = await runInIntegratedTerminal(cwd, command);
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
