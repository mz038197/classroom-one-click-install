import * as vscode from "vscode";
import { CATALOG_FILENAME, CourseLaneService } from "./courseLaneService";
import {
  RUN_INSTALL_ACTION_COMMAND,
  SidebarTreeProvider,
} from "./sidebarTreeProvider";

export function activate(context: vscode.ExtensionContext): void {
  const courseLane = new CourseLaneService();
  const provider = new SidebarTreeProvider(courseLane);
  let catalogWatcher: vscode.FileSystemWatcher | undefined;

  const reload = (): void => {
    void courseLane.reload().then(() => provider.refresh());
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
    catalogWatcher.onDidCreate(reload);
    catalogWatcher.onDidChange(reload);
    catalogWatcher.onDidDelete(reload);
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
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      watchCatalog();
      reload();
    }),
    courseLane.onDidChange(() => provider.refresh()),
  );

  watchCatalog();
  reload();
}

export function deactivate(): void {
  // no-op
}
