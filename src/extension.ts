import * as vscode from "vscode";
import { CATALOG_FILENAME, CourseLaneService } from "./courseLaneService";
import {
  confirmEnvironmentInstall,
  detectInstallPlatform,
  executeEnvironmentInstallPlan,
} from "./environmentInstallExecutor";
import { EnvironmentLaneService } from "./environmentLane";
import { createDefaultProbeRunner } from "./probeRunner";
import type { EnvironmentToolId } from "./toolProbe";
import {
  INSTALL_ENVIRONMENT_TOOL_COMMAND,
  RECHECK_ENVIRONMENT_COMMAND,
  RUN_INSTALL_ACTION_COMMAND,
  SidebarTreeProvider,
} from "./sidebarTreeProvider";

export function activate(context: vscode.ExtensionContext): void {
  const environmentLane = new EnvironmentLaneService(createDefaultProbeRunner(), {
    platform: detectInstallPlatform(),
    confirm: confirmEnvironmentInstall,
    execute: executeEnvironmentInstallPlan,
  });
  const courseLane = new CourseLaneService(() => environmentLane.getReadiness());
  const provider = new SidebarTreeProvider(courseLane, environmentLane);
  let catalogWatcher: vscode.FileSystemWatcher | undefined;

  const refreshUi = (): void => {
    provider.refresh();
  };

  const reloadCatalog = (): void => {
    void courseLane.reload().then(refreshUi);
  };

  const recheckEnvironment = async (): Promise<void> => {
    await environmentLane.recheck();
    refreshUi();
  };

  const installEnvironmentTool = async (toolId: EnvironmentToolId): Promise<void> => {
    const result = await environmentLane.installTool(toolId);
    refreshUi();
    if (result === "ran") {
      void vscode.window.showInformationMessage(
        "安裝流程已結束。請重開整合終端機後再按「重新檢查」。",
      );
    } else if (result === "failed") {
      const detail =
        environmentLane.getView().tools.find((t) => t.id === toolId)?.detail ??
        "安裝失敗";
      void vscode.window.showErrorMessage(detail);
    }
  };

  const watchCatalog = (): void => {
    catalogWatcher?.dispose();
    catalogWatcher = undefined;
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
      return;
    }
    catalogWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(folder, CATALOG_FILENAME),
    );
    catalogWatcher.onDidCreate(reloadCatalog);
    catalogWatcher.onDidChange(reloadCatalog);
    catalogWatcher.onDidDelete(reloadCatalog);
  };

  context.subscriptions.push(
    courseLane,
    {
      dispose: () => {
        catalogWatcher?.dispose();
      },
    },
    vscode.window.registerTreeDataProvider("vansClassroomInstall.sidebar", provider),
    vscode.commands.registerCommand(RUN_INSTALL_ACTION_COMMAND, (actionId: string) => {
      void courseLane.runAction(actionId);
    }),
    vscode.commands.registerCommand(RECHECK_ENVIRONMENT_COMMAND, () => {
      void recheckEnvironment();
    }),
    vscode.commands.registerCommand(
      INSTALL_ENVIRONMENT_TOOL_COMMAND,
      (toolId: EnvironmentToolId) => {
        void installEnvironmentTool(toolId);
      },
    ),
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      watchCatalog();
      reloadCatalog();
      void recheckEnvironment();
    }),
    courseLane.onDidChange(refreshUi),
  );

  watchCatalog();
  reloadCatalog();
  void recheckEnvironment();
}

export function deactivate(): void {
  // no-op
}
