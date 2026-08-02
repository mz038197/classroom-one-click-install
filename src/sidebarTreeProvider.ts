import * as vscode from "vscode";
import {
  buildSidebarShell,
  type SidebarLaneId,
  type SidebarShell,
} from "./sidebarShell";
import { workspaceDisplayName } from "./workspaceDisplayName";

type SidebarNode =
  | { kind: "workspace"; label: string }
  | { kind: "lane"; label: string; laneId: SidebarLaneId }
  | { kind: "placeholder"; label: string; parentLaneId: SidebarLaneId };

export class SidebarTreeProvider implements vscode.TreeDataProvider<SidebarNode> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<
    SidebarNode | undefined | null | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

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
    const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
    item.contextValue = "placeholder";
    item.description = "占位";
    return item;
  }

  getChildren(element?: SidebarNode): SidebarNode[] {
    const shell = this.currentShell();
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
    if (element.kind === "lane") {
      const lane = shell.lanes.find((l) => l.id === element.laneId);
      if (!lane) {
        return [];
      }
      return [
        {
          kind: "placeholder",
          label: lane.placeholder,
          parentLaneId: lane.id,
        },
      ];
    }
    return [];
  }

  /** 供測試／偵錯讀取目前殼模型（不含自訂命令輸入）。 */
  currentShell(): SidebarShell {
    const folders = vscode.workspace.workspaceFolders?.map((f) => ({
      name: f.name,
    }));
    return buildSidebarShell(workspaceDisplayName(folders));
  }
}
