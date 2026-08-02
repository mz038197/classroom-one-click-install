import type { ToolReadiness } from "./actionDependencyGate";
import {
  parseToolProbeResult,
  type EnvironmentToolId,
  type ToolProbeInput,
  type ToolProbeStatus,
} from "./toolProbe";

export type ProbeRunner = (tool: EnvironmentToolId) => Promise<ToolProbeInput>;

export type EnvironmentToolView = {
  id: EnvironmentToolId;
  label: string;
  status: "ready" | "missing";
  detail: string;
};

export type EnvironmentLaneView = {
  tools: EnvironmentToolView[];
  toolchainReady: boolean;
  tip?: string;
};

const TOOL_ORDER: readonly EnvironmentToolId[] = ["uv", "git", "node"];

const TOOL_LABEL: Record<EnvironmentToolId, string> = {
  uv: "uv",
  git: "git",
  node: "Node.js",
};

const MISSING_TIP =
  "若剛在編輯器外安裝，請新開／重開整合終端機後再按「重新檢查」。";

type ToolStatusMap = Record<EnvironmentToolId, ToolProbeStatus>;

export function buildEnvironmentLaneView(statuses: ToolStatusMap): EnvironmentLaneView {
  const tools: EnvironmentToolView[] = TOOL_ORDER.map((id) => {
    const status = statuses[id];
    if (status.status === "ready") {
      return {
        id,
        label: TOOL_LABEL[id],
        status: "ready",
        detail: status.version,
      };
    }
    return {
      id,
      label: TOOL_LABEL[id],
      status: "missing",
      detail: "未安裝",
    };
  });

  const toolchainReady = tools.every((t) => t.status === "ready");
  return {
    tools,
    toolchainReady,
    tip: toolchainReady ? undefined : MISSING_TIP,
  };
}

const UNKNOWN: ToolStatusMap = {
  uv: { status: "missing" },
  git: { status: "missing" },
  node: { status: "missing" },
};

/** Environment Lane：偵測／重新檢查；安裝流程另票。 */
export class EnvironmentLaneService {
  private statuses: ToolStatusMap = { ...UNKNOWN };

  constructor(private readonly probe: ProbeRunner) {}

  getView(): EnvironmentLaneView {
    return buildEnvironmentLaneView(this.statuses);
  }

  getReadiness(): ToolReadiness {
    return {
      uv: this.statuses.uv.status === "ready",
      git: this.statuses.git.status === "ready",
      node: this.statuses.node.status === "ready",
    };
  }

  async recheck(): Promise<void> {
    const next = { ...UNKNOWN };
    for (const tool of TOOL_ORDER) {
      const raw = await this.probe(tool);
      next[tool] = parseToolProbeResult(tool, raw);
    }
    this.statuses = next;
  }
}
