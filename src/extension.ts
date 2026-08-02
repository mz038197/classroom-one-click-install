import * as vscode from "vscode";
import { SidebarTreeProvider } from "./sidebarTreeProvider";

export function activate(context: vscode.ExtensionContext): void {
  const provider = new SidebarTreeProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("classroomOneClickInstall.sidebar", provider),
    vscode.workspace.onDidChangeWorkspaceFolders(() => provider.refresh()),
  );
}

export function deactivate(): void {
  // no-op
}
