import * as vscode from "vscode";
import { CATALOG_FILENAME, CourseLaneService } from "./courseLaneService";
import { EnvironmentLaneService } from "./environmentLane";
import { createDefaultProbeRunner } from "./probeRunner";
import {
  RECHECK_ENVIRONMENT_COMMAND,
  RUN_INSTALL_ACTION_COMMAND,
  SidebarTreeProvider,
} from "./sidebarTreeProvider";

export function activate(context: vscode.ExtensionContext): void {
  const environmentLane = new EnvironmentLaneService(createDefaultProbeRunner());
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
    vscode.window.registerTreeDataProvider("classroomOneClickInstall.sidebar", provider),
    vscode.commands.registerCommand(RUN_INSTALL_ACTION_COMMAND, (actionId: string) => {
      void courseLane.runAction(actionId);
    }),
    vscode.commands.registerCommand(RECHECK_ENVIRONMENT_COMMAND, () => {
      void recheckEnvironment();
    }),
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
