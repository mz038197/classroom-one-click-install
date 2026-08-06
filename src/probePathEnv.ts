/**
 * Build a PATH / command shape for Environment Tool probes when the
 * integrated-terminal Shell Integration path is unavailable.
 */

function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
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
