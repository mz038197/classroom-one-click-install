import * as vscode from "vscode";
import type { ActionRunSnapshot } from "./actionRunState";
import type { CourseLaneService } from "./courseLaneService";
import type {
  EnvironmentLaneService,
  EnvironmentToolUiStatus,
} from "./environmentLane";
import type { EnvironmentToolId } from "./toolProbe";
import { buildSidebarShell, type SidebarLaneId } from "./sidebarShell";
import { workspaceDisplayName } from "./workspaceDisplayName";

export const RUN_INSTALL_ACTION_COMMAND = "vansClassroomInstall.runInstallAction";
export const RECHECK_ENVIRONMENT_COMMAND = "vansClassroomInstall.recheckEnvironment";
export const INSTALL_ENVIRONMENT_TOOL_COMMAND =
  "vansClassroomInstall.installEnvironmentTool";

type SidebarNode =
  | { kind: "workspace"; label: string }
  | { kind: "lane"; label: string; laneId: SidebarLaneId }
  | { kind: "message"; label: string; parentLaneId: SidebarLaneId }
  | {
      kind: "recheck";
      label: string;
    }
  | {
      kind: "env-tool";
      toolId: EnvironmentToolId;
      label: string;
      detail: string;
      status: EnvironmentToolUiStatus;
      actionLabel: "安裝" | "重新安裝／修復";
    }
  | {
      kind: "action";
      actionId: string;
      title: string;
      description?: string;
      run: ActionRunSnapshot;
      disabledReason?: string;
    };

export class SidebarTreeProvider implements vscode.TreeDataProvider<SidebarNode> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<
    SidebarNode | undefined | null | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(
    private readonly courseLane: CourseLaneService,
    private readonly environmentLane: EnvironmentLaneService,
  ) {}

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
    if (element.kind === "recheck") {
      const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
      item.contextValue = "recheck";
      item.command = {
        command: RECHECK_ENVIRONMENT_COMMAND,
        title: "重新檢查",
      };
      return item;
    }
    if (element.kind === "env-tool") {
      const item = new vscode.TreeItem(
        `${envPrefix(element.status)}${element.label}`,
        vscode.TreeItemCollapsibleState.None,
      );
      item.description = `${element.detail} · ${element.actionLabel}`;
      item.contextValue = `env-tool:${element.status}`;
      item.tooltip = `${element.label}\n${element.detail}`;
      if (element.status !== "installing") {
        item.command = {
          command: INSTALL_ENVIRONMENT_TOOL_COMMAND,
          title: element.actionLabel,
          arguments: [element.toolId],
        };
      }
      return item;
    }

    if (element.disabledReason) {
      const item = new vscode.TreeItem(
        `⊘ ${element.title}`,
        vscode.TreeItemCollapsibleState.None,
      );
      item.contextValue = "action:disabled";
      item.description = element.disabledReason;
      item.tooltip = [
        element.description,
        `id: ${element.actionId}`,
        element.disabledReason,
      ]
        .filter(Boolean)
        .join("\n");
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
      return this.environmentChildren();
    }

    if (element.kind === "lane" && element.laneId === "course") {
      return this.courseChildren();
    }

    return [];
  }

  private environmentChildren(): SidebarNode[] {
    const view = this.environmentLane.getView();
    const badge = view.toolchainReady
      ? "Toolchain Ready：uv · git · Node 皆就緒"
      : `Toolchain Ready：未齊（uv ${readyMark(view, "uv")} · git ${readyMark(view, "git")} · Node ${readyMark(view, "node")}）`;
    const nodes: SidebarNode[] = [
      { kind: "message", label: badge, parentLaneId: "environment" },
      { kind: "recheck", label: "↻ 重新檢查" },
      ...view.tools.map((tool) => ({
        kind: "env-tool" as const,
        toolId: tool.id,
        label: tool.label,
        detail: tool.detail,
        status: tool.status,
        actionLabel: tool.actionLabel,
      })),
    ];
    if (view.tip) {
      nodes.push({ kind: "message", label: view.tip, parentLaneId: "environment" });
    }
    return nodes;
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
        disabledReason: action.disabledReason,
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

function envPrefix(status: EnvironmentToolUiStatus): string {
  switch (status) {
    case "ready":
      return "✓ ";
    case "needs-reopen-terminal":
      return "↻ ";
    case "failed":
      return "✗ ";
    case "installing":
      return "… ";
    default:
      return "✗ ";
  }
}

function readyMark(
  view: ReturnType<EnvironmentLaneService["getView"]>,
  id: EnvironmentToolId,
): string {
  return view.tools.find((t) => t.id === id)?.status === "ready" ? "✓" : "✗";
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
