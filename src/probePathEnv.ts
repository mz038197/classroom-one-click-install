/**
 * Build a PATH / command shape for Environment Tool probes when the
 * integrated-terminal Shell Integration path is unavailable.
 */

import type { EnvironmentToolId } from "./toolProbe";

function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/**
 * VS Code 整合終端也不保證已載入 `.zshrc`（uv 常寫在 `~/.local/bin`）。
 * 探測指令補使用者 bin；nvm 只加在 Node 探測，避免拖垮 uv／git。
 */
export function wrapUnixProbeCommand(command: string): string {
  return [
    'export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"',
    command,
  ].join("; ");
}

function wrapUnixNodeProbeCommand(command: string): string {
  return wrapUnixProbeCommand(
    [
      'export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"',
      '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"',
      command,
    ].join("; "),
  );
}

export function environmentProbeCommands(
  tool: EnvironmentToolId,
  platform: NodeJS.Platform,
): string[] {
  const raw =
    tool === "uv"
      ? ["uv --version"]
      : tool === "git"
        ? ["git --version"]
        : ["node --version", "npm --version"];
  if (platform === "win32") {
    return raw;
  }
  if (tool === "node") {
    return raw.map(wrapUnixNodeProbeCommand);
  }
  return raw.map(wrapUnixProbeCommand);
}

export function buildProbeHostCommand(input: {
  platform: NodeJS.Platform;
  command: string;
  shell?: string;
}): string {
  if (input.platform === "win32") {
    return input.command;
  }
  const shell = input.shell?.trim() || "/bin/bash";
  return `${shell} -lc ${shellSingleQuote(input.command)}`;
}

export function buildProbeExecEnv(input: {
  platform: NodeJS.Platform;
  processEnv: NodeJS.ProcessEnv;
  windowsPath?: string;
}): NodeJS.ProcessEnv {
  if (input.platform === "win32" && input.windowsPath?.trim()) {
    const path = input.windowsPath.trim();
    return { ...input.processEnv, PATH: path, Path: path };
  }
  return { ...input.processEnv };
}
