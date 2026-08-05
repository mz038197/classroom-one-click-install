import * as vscode from "vscode";
import { CATALOG_FILENAME, CourseLaneService } from "./courseLaneService";
import {
  confirmEnvironmentInstall,
  detectInstallPlatform,
  executeEnvironmentInstallPlan,
} from "./environmentInstallExecutor";
import { EnvironmentLaneService } from "./environmentLane";
import { resolveEditorUserDir } from "./editorUserPath";
import { createDefaultProbeRunner } from "./probeRunner";
import type { EnvironmentToolId } from "./toolProbe";
import {
  createRouterPortalClient,
  defaultRouterBaseUrl,
} from "./routerPortalClient";
import {
  RouterLaneService,
  type RouterLaneActionResult,
} from "./routerLaneService";
import {
  INSTALL_ENVIRONMENT_TOOL_COMMAND,
  RECHECK_ENVIRONMENT_COMMAND,
  RUN_INSTALL_ACTION_COMMAND,
} from "./sidebarCommands";
import { SidebarWebviewProvider } from "./sidebarWebviewProvider";

const API_KEY_SECRET = "classroomApiKey";

export function activate(context: vscode.ExtensionContext): void {
  const environmentLane = new EnvironmentLaneService(createDefaultProbeRunner(), {
    platform: detectInstallPlatform(),
    confirm: confirmEnvironmentInstall,
    execute: executeEnvironmentInstallPlan,
  });
  const courseLane = new CourseLaneService(() => environmentLane.getReadiness());

  const baseUrl = defaultRouterBaseUrl((key) =>
    vscode.workspace.getConfiguration().get(key),
  );
  const routerLane = new RouterLaneService(createRouterPortalClient(baseUrl), {
    baseUrl,
    openExternal: (url) => vscode.env.openExternal(vscode.Uri.parse(url)),
    resolveUserDir: () =>
      resolveEditorUserDir({
        platform: process.platform,
        uriScheme: vscode.env.uriScheme,
      }),
    uriScheme: vscode.env.uriScheme,
    extensionId: context.extension.id,
    secretStore: {
      get: (key) => context.secrets.get(key),
      store: (key, value) => context.secrets.store(key, value),
      delete: (key) => context.secrets.delete(key),
    },
    apiKeySecretKey: API_KEY_SECRET,
  });

  let catalogWatcher: vscode.FileSystemWatcher | undefined;

  const offerReload = async (message: string): Promise<void> => {
    const choice = await vscode.window.showInformationMessage(
      message,
      "重載視窗",
    );
    if (choice === "重載視窗") {
      await vscode.commands.executeCommand("workbench.action.reloadWindow");
    }
  };

  const afterRouterAction = async (
    result: RouterLaneActionResult,
    reloadMessage: string,
  ): Promise<void> => {
    refreshUi();
    if (result.needsReload) {
      await offerReload(reloadMessage);
    }
  };

  const provider = new SidebarWebviewProvider(
    context.extensionUri,
    courseLane,
    environmentLane,
    routerLane,
    {
      recheck: () => recheckEnvironment(),
      installEnv: (toolId) => installEnvironmentTool(toolId),
      runAction: async (actionId) => {
        await courseLane.runAction(actionId);
      },
      routerSignIn: async () => {
        await routerLane.openGoogleSignIn();
        refreshUi();
      },
      routerRedeem: async () => {
        const result = await routerLane.redeemAndSetup();
        await afterRouterAction(
          result,
          "BYOK 已寫入。請重載視窗後選 VCRouter 模型。",
        );
      },
      routerClear: async () => {
        const confirm = await vscode.window.showWarningMessage(
          "確定清除課堂連線？將移除 VCRouter 與本機 Classroom API Key，其他模型設定不受影響。",
          { modal: true },
          "清除",
        );
        if (confirm !== "清除") {
          return;
        }
        const result = await routerLane.clearClassroomConnection();
        await afterRouterAction(
          result,
          "已清除課堂連線。請重載視窗使變更生效。",
        );
      },
      routerHandoffPaste: async (raw) => {
        const result = await routerLane.acceptHandoffInput(raw);
        await afterRouterAction(
          result,
          "BYOK 已寫入。請重載視窗後選 VCRouter 模型。",
        );
      },
    },
  );

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
    vscode.window.registerWebviewViewProvider(
      SidebarWebviewProvider.viewType,
      provider,
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
    vscode.window.registerUriHandler({
      handleUri(uri: vscode.Uri): void {
        void routerLane.acceptHandoffInput(uri.toString(true)).then((result) => {
          void afterRouterAction(
            result,
            "BYOK 已寫入。請重載視窗後選 VCRouter 模型。",
          );
          void vscode.commands.executeCommand(
            "workbench.view.extension.vansClassroomInstall",
          );
        });
      },
    }),
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
    routerLane.onDidChange(refreshUi),
  );

  watchCatalog();
  reloadCatalog();
  void recheckEnvironment();
  void routerLane.restoreFromSecrets().then(refreshUi);
}

export function deactivate(): void {
  // no-op
}
