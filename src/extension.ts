import * as vscode from "vscode";
import { CATALOG_FILENAME, CourseLaneService } from "./courseLaneService";
import {
  confirmEnvironmentInstall,
  detectInstallPlatform,
  executeEnvironmentInstallPlan,
} from "./environmentInstallExecutor";
import { EnvironmentLaneService } from "./environmentLane";
import { chatLanguageModelsPath, resolveEditorUserDir } from "./editorUserPath";
import { createDefaultProbeRunner } from "./probeRunner";
import type { EnvironmentToolId } from "./toolProbe";
import {
  createRouterPortalClient,
  defaultRouterBaseUrl,
} from "./routerPortalClient";
import { RouterLaneService } from "./routerLaneService";
import {
  INSTALL_ENVIRONMENT_TOOL_COMMAND,
  RECHECK_ENVIRONMENT_COMMAND,
  RUN_INSTALL_ACTION_COMMAND,
} from "./sidebarCommands";
import { SidebarWebviewProvider } from "./sidebarWebviewProvider";
import { spikeByokHostSecret } from "./spikeByokHostSecret";

const API_KEY_SECRET = "classroomApiKey";
const SPIKE_BYOK_HOST_SECRET_COMMAND =
  "vansClassroomInstall.spikeByokHostSecret";

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
    secretStore: {
      get: (key) => context.secrets.get(key),
      store: (key, value) => context.secrets.store(key, value),
    },
    apiKeySecretKey: API_KEY_SECRET,
  });

  let catalogWatcher: vscode.FileSystemWatcher | undefined;

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
      routerSignIn: () => routerLane.openGoogleSignIn(),
      routerRedeem: () => routerLane.redeemAndSetup(),
      routerHandoffPaste: (raw) => routerLane.acceptHandoffInput(raw),
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

  const runSpikeByokHostSecret = async (): Promise<void> => {
    try {
      const userDir = resolveEditorUserDir({
        platform: process.platform,
        uriScheme: vscode.env.uriScheme,
      });
      const result = await spikeByokHostSecret({
        modelsPath: chatLanguageModelsPath(userDir),
        getClassroomApiKey: () =>
          Promise.resolve(context.secrets.get(API_KEY_SECRET)),
        storeSecret: (key, value) =>
          Promise.resolve(context.secrets.store(key, value)),
      });
      void vscode.window.showInformationMessage(
        `已改寫為 ${result.apiKeyRef}。請重載視窗後用 VCRouter 試一則 chat（spike 驗證）。`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      void vscode.window.showErrorMessage(`BYOK secret spike 失敗：${message}`);
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
        void routerLane.acceptHandoffInput(uri.toString(true)).then(() => {
          refreshUi();
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
    vscode.commands.registerCommand(SPIKE_BYOK_HOST_SECRET_COMMAND, () => {
      void runSpikeByokHostSecret();
    }),
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
