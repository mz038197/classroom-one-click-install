import * as vscode from "vscode";
import type { ActionRunSnapshot } from "./actionRunState";
import type { CourseLaneService } from "./courseLaneService";
import { buildSidebarShell, type SidebarLaneId } from "./sidebarShell";
import { workspaceDisplayName } from "./workspaceDisplayName";

export const RUN_INSTALL_ACTION_COMMAND = "classroomOneClickInstall.runInstallAction";

type SidebarNode =
  | { kind: "workspace"; label: string }
  | { kind: "lane"; label: string; laneId: SidebarLaneId }
  | { kind: "message"; label: string; parentLaneId: SidebarLaneId }
  | {
      kind: "action";
      actionId: string;
      title: string;
      description?: string;
      run: ActionRunSnapshot;
    };

export class SidebarTreeProvider implements vscode.TreeDataProvider<SidebarNode> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<
    SidebarNode | undefined | null | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private readonly courseLane: CourseLaneService) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SidebarNode): vscode.TreeItem {
    if (element.kind === "workspace") {
      const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
      item.contextValue = "workspace";
      return item;
    }
    if (element.kind === "lane") {
      const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.Expanded);
      item.contextValue = `lane:${element.laneId}`;
      return item;
    }
    if (element.kind === "message") {
      const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
      item.contextValue = "message";
      return item;
    }

    const item = new vscode.TreeItem(
      statusPrefix(element.run) + element.title,
      vscode.TreeItemCollapsibleState.None,
    );
    item.contextValue = `action:${element.run.status}`;
    item.description = [element.description, statusDescription(element.run)]
      .filter(Boolean)
      .join(" · ");
    item.tooltip = [element.description, `id: ${element.actionId}`, element.run.detail]
      .filter(Boolean)
      .join("\n");
    if (element.run.status !== "running") {
      item.command = {
        command: RUN_INSTALL_ACTION_COMMAND,
        title: actionCommandTitle(element.run),
        arguments: [element.actionId],
      };
    }
    return item;
  }

  getChildren(element?: SidebarNode): SidebarNode[] {
    const shell = this.shell();
    if (!element) {
      return [
        { kind: "workspace", label: shell.workspaceLabel },
        ...shell.lanes.map((lane) => ({
          kind: "lane" as const,
          label: lane.title,
          laneId: lane.id,
        })),
      ];
    }

    if (element.kind === "lane" && element.laneId === "environment") {
      const lane = shell.lanes.find((l) => l.id === "environment");
      return [
        {
          kind: "message",
          label: lane?.placeholder ?? "（占位）",
          parentLaneId: "environment",
        },
      ];
    }

    if (element.kind === "lane" && element.laneId === "course") {
      return this.courseChildren();
    }

    return [];
  }

  private courseChildren(): SidebarNode[] {
    const view = this.courseLane.getView();
    if (view.kind === "no-workspace") {
      return [{ kind: "message", label: "請先開啟工作區資料夾", parentLaneId: "course" }];
    }
    if (view.kind === "missing" || view.kind === "invalid") {
      return [
        {
          kind: "message",
          label: `來自 classroom-installs.yaml`,
          parentLaneId: "course",
        },
        { kind: "message", label: view.message, parentLaneId: "course" },
      ];
    }
    if (view.actions.length === 0) {
      return [
        {
          kind: "message",
          label: "來自 classroom-installs.yaml（actions 為空）",
          parentLaneId: "course",
        },
      ];
    }
    return [
      {
        kind: "message",
        label: "來自 classroom-installs.yaml",
        parentLaneId: "course",
      },
      ...view.actions.map((action) => ({
        kind: "action" as const,
        actionId: action.id,
        title: action.title,
        description: action.description,
        run: action.run,
      })),
    ];
  }

  private shell() {
    const folders = vscode.workspace.workspaceFolders?.map((f) => ({
      name: f.name,
    }));
    return buildSidebarShell(workspaceDisplayName(folders));
  }
}

function statusPrefix(run: ActionRunSnapshot): string {
  switch (run.status) {
    case "running":
      return "… ";
    case "succeeded":
      return "✓ ";
    case "failed":
      return "✗ ";
    case "unverified":
      return "? ";
    default:
      return "▶ ";
  }
}

function statusDescription(run: ActionRunSnapshot): string {
  switch (run.status) {
    case "running":
      return "進行中…（見終端機）";
    case "succeeded":
      return "成功 · 再執行";
    case "failed":
      return `${run.detail ?? "失敗"} · 重試`;
    case "unverified":
      return `${run.detail ?? "已送出／未驗證"} · 重試`;
    default:
      return "未執行 · 安裝";
  }
}

function actionCommandTitle(run: ActionRunSnapshot): string {
  switch (run.status) {
    case "succeeded":
      return "再執行";
    case "failed":
    case "unverified":
      return "重試";
    default:
      return "安裝";
  }
}
