import type { ToolReadiness } from "./actionDependencyGate";
import { buildEnvironmentInstallConfirm } from "./environmentInstallConfirm";
import {
  resolveEnvironmentInstallPlan,
  type EnvironmentInstallPlan,
  type InstallPlatform,
} from "./environmentInstallPlan";
import {
  parseToolProbeResult,
  type EnvironmentToolId,
  type ToolProbeInput,
  type ToolProbeStatus,
} from "./toolProbe";

export type ProbeRunner = (tool: EnvironmentToolId) => Promise<ToolProbeInput>;

export type InstallExecuteResult = { ok: true } | { ok: false; detail: string };

export type EnvironmentInstallDeps = {
  platform: InstallPlatform;
  confirm: (title: string, detail: string) => Promise<boolean>;
  execute: (plan: EnvironmentInstallPlan) => Promise<InstallExecuteResult>;
};

export type EnvironmentToolUiStatus =
  | "ready"
  | "missing"
  | "needs-reopen-terminal"
  | "failed"
  | "installing";

export type EnvironmentToolView = {
  id: EnvironmentToolId;
  label: string;
  status: EnvironmentToolUiStatus;
  detail: string;
  /** 側邊欄動作：安裝或重新安裝／修復 */
  actionLabel: "安裝" | "重新安裝／修復";
};

export type EnvironmentLaneView = {
  tools: EnvironmentToolView[];
  toolchainReady: boolean;
  tip?: string;
};

type Overlay =
  | { kind: "needs-reopen-terminal" }
  | { kind: "failed"; detail: string }
  | { kind: "installing" };

const TOOL_ORDER: readonly EnvironmentToolId[] = ["uv", "git", "node"];

const TOOL_LABEL: Record<EnvironmentToolId, string> = {
  uv: "uv",
  git: "git",
  node: "Node.js",
};

const REOPEN_DETAIL = "請重開終端機再重新檢查";
const MISSING_TIP =
  "若剛在編輯器外安裝，請新開／重開整合終端機後再按「重新檢查」。";
const IT_HINT = "請找 IT／管理員協助；本擴充功能不會嘗試提權。";

type ToolStatusMap = Record<EnvironmentToolId, ToolProbeStatus>;

export function buildEnvironmentLaneView(
  statuses: ToolStatusMap,
  overlays: Partial<Record<EnvironmentToolId, Overlay>> = {},
): EnvironmentLaneView {
  const tools: EnvironmentToolView[] = TOOL_ORDER.map((id) => {
    const overlay = overlays[id];
    const probed = statuses[id];
    if (overlay?.kind === "installing") {
      return {
        id,
        label: TOOL_LABEL[id],
        status: "installing",
        detail: "安裝中…",
        actionLabel: actionLabelFor(probed),
      };
    }
    if (overlay?.kind === "needs-reopen-terminal") {
      return {
        id,
        label: TOOL_LABEL[id],
        status: "needs-reopen-terminal",
        detail: REOPEN_DETAIL,
        actionLabel: "重新安裝／修復",
      };
    }
    if (overlay?.kind === "failed") {
      return {
        id,
        label: TOOL_LABEL[id],
        status: "failed",
        detail: overlay.detail,
        actionLabel: actionLabelFor(probed),
      };
    }
    if (probed.status === "ready") {
      return {
        id,
        label: TOOL_LABEL[id],
        status: "ready",
        detail: probed.version,
        actionLabel: "重新安裝／修復",
      };
    }
    return {
      id,
      label: TOOL_LABEL[id],
      status: "missing",
      detail: "未安裝",
      actionLabel: "安裝",
    };
  });

  const toolchainReady = tools.every((t) => t.status === "ready");
  const needsTip =
    !toolchainReady ||
    tools.some((t) => t.status === "needs-reopen-terminal" || t.status === "missing");
  return {
    tools,
    toolchainReady,
    tip: needsTip && !toolchainReady ? MISSING_TIP : undefined,
  };
}

function actionLabelFor(probed: ToolProbeStatus): "安裝" | "重新安裝／修復" {
  return probed.status === "ready" ? "重新安裝／修復" : "安裝";
}

const UNKNOWN: ToolStatusMap = {
  uv: { status: "missing" },
  git: { status: "missing" },
  node: { status: "missing" },
};

/** Environment Lane：偵測／重新檢查／安裝與請重開終端。 */
export class EnvironmentLaneService {
  private statuses: ToolStatusMap = { ...UNKNOWN };
  private overlays: Partial<Record<EnvironmentToolId, Overlay>> = {};

  constructor(
    private readonly probe: ProbeRunner,
    private readonly installDeps?: EnvironmentInstallDeps,
  ) {}

  getView(): EnvironmentLaneView {
    return buildEnvironmentLaneView(this.statuses, this.overlays);
  }

  getReadiness(): ToolReadiness {
    const view = this.getView();
    return {
      uv: view.tools.find((t) => t.id === "uv")?.status === "ready",
      git: view.tools.find((t) => t.id === "git")?.status === "ready",
      node: view.tools.find((t) => t.id === "node")?.status === "ready",
    };
  }

  async recheck(): Promise<void> {
    const next = { ...UNKNOWN };
    for (const tool of TOOL_ORDER) {
      const raw = await this.probe(tool);
      next[tool] = parseToolProbeResult(tool, raw);
    }
    this.statuses = next;

    const nextOverlays: Partial<Record<EnvironmentToolId, Overlay>> = {};
    for (const tool of TOOL_ORDER) {
      if (next[tool].status === "ready") {
        continue;
      }
      const overlay = this.overlays[tool];
      // 未探測到就緒前保留「請重開終端」與失敗／IT 提示；installing 清掉。
      if (
        overlay?.kind === "needs-reopen-terminal" ||
        overlay?.kind === "failed"
      ) {
        nextOverlays[tool] = overlay;
      }
    }
    this.overlays = nextOverlays;
  }

  async installTool(
    tool: EnvironmentToolId,
  ): Promise<"cancelled" | "ran" | "failed" | "unavailable"> {
    if (!this.installDeps) {
      return "unavailable";
    }
    if (this.overlays[tool]?.kind === "installing") {
      return "cancelled";
    }

    const plan = resolveEnvironmentInstallPlan(tool, this.installDeps.platform);
    const probed = this.statuses[tool];
    const mode =
      this.overlays[tool]?.kind === "needs-reopen-terminal"
        ? "needs-reopen-terminal"
        : this.overlays[tool]?.kind === "failed"
          ? "failed"
          : probed.status === "ready"
            ? "ready"
            : "missing";
    const confirm = buildEnvironmentInstallConfirm(plan, mode);
    const ok = await this.installDeps.confirm(confirm.title, confirm.detail);
    if (!ok) {
      return "cancelled";
    }

    this.overlays[tool] = { kind: "installing" };
    const result = await this.installDeps.execute(plan);
    if (!result.ok) {
      this.overlays[tool] = {
        kind: "failed",
        detail: `${result.detail} · ${IT_HINT}`,
      };
      return "failed";
    }

    // 規格：安裝結束不得直接標就緒。
    this.overlays[tool] = { kind: "needs-reopen-terminal" };
    return "ran";
  }
}
