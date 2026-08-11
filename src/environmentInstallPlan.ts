import type { EnvironmentToolId } from "./toolProbe";

export type InstallPlatform = "win32" | "darwin";

export type ResolveEnvironmentInstallPlanOptions = {
  /** When true on win32, git/Node use winget shell plans. */
  wingetAvailable?: boolean;
};

export type EnvironmentInstallPlan = {
  tool: EnvironmentToolId;
  platform: InstallPlatform;
  kind: "shell" | "open-url";
  /** 將執行的命令，或官方下載／安裝頁 URL。 */
  commandOrUrl: string;
  /** 確認框用：風險與內容摘要。 */
  summary: string;
  /** 可選：先檢視遠端腳本的替代命令。 */
  previewCommand?: string;
};

const WINGET_ACCEPT =
  "--accept-package-agreements --accept-source-agreements";

/** 規格／研究票預設安裝路徑（不提權、不繞過 MDM）。 */
export function resolveEnvironmentInstallPlan(
  tool: EnvironmentToolId,
  platform: InstallPlatform,
  options: ResolveEnvironmentInstallPlanOptions = {},
): EnvironmentInstallPlan {
  if (tool === "uv") {
    if (platform === "win32") {
      return {
        tool,
        platform,
        kind: "shell",
        commandOrUrl:
          'powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"',
        summary:
          "將以 PowerShell ByPass 執行 Astral 官方遠端安裝腳本（https://astral.sh/uv/install.ps1）。",
        previewCommand:
          'powershell -c "irm https://astral.sh/uv/install.ps1 | more"',
      };
    }
    return {
      tool,
      platform,
      kind: "shell",
      commandOrUrl: "curl -LsSf https://astral.sh/uv/install.sh | sh",
      summary:
        "將以 curl 下載並執行 Astral 官方遠端安裝腳本（https://astral.sh/uv/install.sh）。",
      previewCommand: "curl -LsSf https://astral.sh/uv/install.sh | less",
    };
  }

  if (tool === "git") {
    if (platform === "win32") {
      if (options.wingetAvailable) {
        return {
          tool,
          platform,
          kind: "shell",
          commandOrUrl: `winget install --id Git.Git -e ${WINGET_ACCEPT}`,
          summary:
            "將以 winget 安裝 Git for Windows（可能出現 UAC／需 IT；不會嘗試提權）。",
        };
      }
      return {
        tool,
        platform,
        kind: "open-url",
        commandOrUrl: "https://git-scm.com/install/windows",
        summary:
          "將開啟 Git for Windows 官方下載頁；請執行系統安裝器（可能出現 UAC／需 IT）。",
      };
    }
    return {
      tool,
      platform,
      kind: "shell",
      commandOrUrl: "xcode-select --install",
      summary:
        "將啟動 macOS Xcode Command Line Tools 安裝流程（系統對話框；可能需管理員授權）。",
    };
  }

  // node
  if (platform === "win32") {
    if (options.wingetAvailable) {
      return {
        tool,
        platform,
        kind: "shell",
        commandOrUrl: `winget install --id OpenJS.NodeJS.LTS -e ${WINGET_ACCEPT}`,
        summary:
          "將以 winget 安裝 Node.js LTS（可能出現 UAC／需 IT；不會嘗試提權）。",
      };
    }
    return {
      tool,
      platform,
      kind: "open-url",
      commandOrUrl: "https://nodejs.org/en/download",
      summary:
        "將開啟 Node.js 官方下載頁；請選當期 LTS 的 Windows .msi 安裝器（可能出現 UAC／需 IT）。",
    };
  }
  return {
    tool,
    platform,
    kind: "open-url",
    commandOrUrl: "https://nodejs.org/en/download",
    summary:
      "將開啟 Node.js 官方下載頁；請選當期 LTS 的 macOS .pkg 安裝器（可能需管理員授權）。",
  };
}
