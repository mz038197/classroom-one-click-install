export type EnvironmentToolId = "uv" | "git" | "node";

export type ProbeCommandResult = {
  exitCode: number;
  stdout: string;
};

export type ToolProbeInput = ProbeCommandResult & {
  /** Node 就緒需同時驗證 npm。 */
  npm?: ProbeCommandResult;
};

export type ToolProbeStatus =
  | { status: "ready"; version: string }
  | { status: "missing" };

function extractVersion(tool: EnvironmentToolId, stdout: string): string {
  const line = stdout.trim().split(/\r?\n/)[0]?.trim() ?? "";
  if (tool === "uv") {
    const match = /^uv\s+(\S+)/i.exec(line);
    return match?.[1] ?? line;
  }
  if (tool === "git") {
    const match = /^git version\s+(\S+)/i.exec(line);
    return match?.[1] ?? line;
  }
  return line;
}

/** 將版本命令結果解成就緒版本或未安裝。 */
export function parseToolProbeResult(
  tool: EnvironmentToolId,
  input: ToolProbeInput,
): ToolProbeStatus {
  if (input.exitCode !== 0) {
    return { status: "missing" };
  }
  if (tool === "node") {
    if (!input.npm || input.npm.exitCode !== 0) {
      return { status: "missing" };
    }
  }
  const version = extractVersion(tool, input.stdout);
  if (!version) {
    return { status: "missing" };
  }
  return { status: "ready", version };
}
