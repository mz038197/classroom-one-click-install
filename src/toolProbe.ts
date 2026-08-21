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

function linesOf(stdout: string): string[] {
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function matchUvVersion(line: string): string | undefined {
  const match = /^uv\s+(\d+\.\d+\S*)/i.exec(line);
  return match?.[1];
}

function matchGitVersion(line: string): string | undefined {
  const match = /^git version\s+(\S+)/i.exec(line);
  return match?.[1];
}

function matchNodeVersion(line: string): string | undefined {
  return /^v\d+\.\d+/i.test(line) ? line : undefined;
}

function matchNpmVersion(line: string): string | undefined {
  return /^\d+\.\d+/.test(line) ? line : undefined;
}

function findVersion(
  stdout: string,
  matchLine: (line: string) => string | undefined,
): string | undefined {
  for (const line of linesOf(stdout)) {
    const version = matchLine(line);
    if (version) {
      return version;
    }
  }
  return undefined;
}

/** 將版本命令結果解成就緒版本或未安裝。結束碼不作為就緒條件：有可解析版本行即可。 */
export function parseToolProbeResult(
  tool: EnvironmentToolId,
  input: ToolProbeInput,
): ToolProbeStatus {
  if (tool === "node") {
    const version = findVersion(input.stdout, matchNodeVersion);
    const npmVersion = input.npm
      ? findVersion(input.npm.stdout, matchNpmVersion)
      : undefined;
    if (!version || !npmVersion) {
      return { status: "missing" };
    }
    return { status: "ready", version };
  }

  const matchLine = tool === "uv" ? matchUvVersion : matchGitVersion;
  const version = findVersion(input.stdout, matchLine);
  if (!version) {
    return { status: "missing" };
  }
  return { status: "ready", version };
}
