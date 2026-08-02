import * as vscode from "vscode";
import type { CourseLaneService } from "./courseLaneService";
import type { EnvironmentLaneService } from "./environmentLane";
import type { EnvironmentToolId } from "./toolProbe";
import { buildSidebarViewModel } from "./sidebarViewModel";
import { getSidebarWebviewHtml } from "./sidebarWebviewHtml";
import { workspaceDisplayName } from "./workspaceDisplayName";

const VIEW_TYPE = "vansClassroomInstall.sidebar";

type WebviewInbound =
  | { type: "ready" }
  | { type: "recheck" }
  | { type: "installEnv"; toolId: EnvironmentToolId }
  | { type: "runAction"; actionId: string };

export class SidebarWebviewProvider implements vscode.WebviewViewProvider {
  static readonly viewType = VIEW_TYPE;

  private view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly courseLane: CourseLaneService,
    private readonly environmentLane: EnvironmentLaneService,
    private readonly handlers: {
      recheck: () => Promise<void>;
      installEnv: (toolId: EnvironmentToolId) => Promise<void>;
      runAction: (actionId: string) => Promise<void>;
    },
  ) {}

  refresh(): void {
    void this.postState();
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this.view = webviewView;
    const { webview } = webviewView;
    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "media")],
    };
    const nonce = randomNonce();
    webview.html = getSidebarWebviewHtml(nonce, webview.cspSource);

    webview.onDidReceiveMessage((raw: WebviewInbound) => {
      void this.onMessage(raw);
    });

    webviewView.onDidDispose(() => {
      if (this.view === webviewView) {
        this.view = undefined;
      }
    });

    void this.postState();
  }

  private async onMessage(msg: WebviewInbound): Promise<void> {
    if (!msg || typeof msg !== "object" || !("type" in msg)) {
      return;
    }
    switch (msg.type) {
      case "ready":
        await this.postState();
        return;
      case "recheck":
        await this.handlers.recheck();
        return;
      case "installEnv":
        if (isToolId(msg.toolId)) {
          await this.handlers.installEnv(msg.toolId);
        }
        return;
      case "runAction":
        if (typeof msg.actionId === "string" && msg.actionId.trim()) {
          await this.handlers.runAction(msg.actionId);
        }
        return;
      default:
        return;
    }
  }

  private async postState(): Promise<void> {
    if (!this.view) {
      return;
    }
    const folders = vscode.workspace.workspaceFolders?.map((f) => ({
      name: f.name,
    }));
    const iconUri = this.view.webview
      .asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "media", "icon.png"))
      .toString();
    const payload = {
      ...buildSidebarViewModel({
        workspaceName: workspaceDisplayName(folders),
        environment: this.environmentLane.getView(),
        course: this.courseLane.getView(),
      }),
      iconUri,
    };
    await this.view.webview.postMessage({ type: "state", payload });
  }
}

function isToolId(value: unknown): value is EnvironmentToolId {
  return value === "uv" || value === "git" || value === "node";
}

function randomNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 32; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}
