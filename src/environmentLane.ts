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

export type EnvironmentInstallResult =
  | "cancelled"
  | "ran"
  | "failed"
  | "unavailable"
  | "empty"
  | "busy";

export type EnvironmentInstallDeps = {
  platform: InstallPlatform;
  confirm: (title: string, detail: string) => Promise<boolean>;
  execute: (plan: EnvironmentInstallPlan) => Promise<InstallExecuteResult>;
  /** Windows: prefer winget shell plans for git/Node/PowerShell 7 when true. */
  wingetAvailable?: () => Promise<boolean>;
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
  selected: boolean;
};

export type EnvironmentLaneView = {
  tools: EnvironmentToolView[];
  toolchainReady: boolean;
  tip?: string;
  canInstallSelected: boolean;
  selectionLocked: boolean;
};

type Overlay =
  | { kind: "needs-reopen-terminal" }
  | { kind: "failed"; detail: string }
  | { kind: "installing" };

const TOOL_ORDER: readonly EnvironmentToolId[] = ["uv", "git", "node", "pwsh"];

const TOOL_LABEL: Record<EnvironmentToolId, string> = {
  uv: "uv",
  git: "git",
  node: "Node.js",
  pwsh: "PowerShell 7",
};

const REOPEN_DETAIL = "請重開終端機再重新檢查";
const MISSING_TIP =
  "若剛在編輯器外安裝，請新開／重開整合終端機後再按「重新檢查」。";
const IT_HINT = "請找 IT／管理員協助；本擴充功能不會嘗試提權。";

type ToolStatusMap = Record<EnvironmentToolId, ToolProbeStatus>;

function defaultSelectedForStatus(
  status: EnvironmentToolUiStatus,
): boolean {
  return status === "missing" || status === "failed";
}

export function buildEnvironmentLaneView(
  statuses: ToolStatusMap,
  overlays: Partial<Record<EnvironmentToolId, Overlay>> = {},
  selected: Partial<Record<EnvironmentToolId, boolean>> = {},
  selectionLocked = false,
): EnvironmentLaneView {
  const tools: EnvironmentToolView[] = TOOL_ORDER.map((id) => {
    const overlay = overlays[id];
    const probed = statuses[id];
    const row = toolRow(id, probed, overlay);
    const isSelected =
      selected[id] !== undefined
        ? Boolean(selected[id])
        : defaultSelectedForStatus(row.status);
    return { ...row, selected: isSelected };
  });

  const toolchainReady = tools.every((t) => t.status === "ready");
  const needsTip =
    !toolchainReady ||
    tools.some((t) => t.status === "needs-reopen-terminal" || t.status === "missing");
  const canInstallSelected =
    !selectionLocked && tools.some((t) => t.selected);
  return {
    tools,
    toolchainReady,
    tip: needsTip && !toolchainReady ? MISSING_TIP : undefined,
    canInstallSelected,
    selectionLocked,
  };
}

function toolRow(
  id: EnvironmentToolId,
  probed: ToolProbeStatus,
  overlay: Overlay | undefined,
): Omit<EnvironmentToolView, "selected"> {
  if (overlay?.kind === "installing") {
    return {
      id,
      label: TOOL_LABEL[id],
      status: "installing",
      detail: "安裝中…",
    };
  }
  if (overlay?.kind === "needs-reopen-terminal") {
    return {
      id,
      label: TOOL_LABEL[id],
      status: "needs-reopen-terminal",
      detail: REOPEN_DETAIL,
    };
  }
  if (overlay?.kind === "failed") {
    return {
      id,
      label: TOOL_LABEL[id],
      status: "failed",
      detail: overlay.detail,
    };
  }
  if (probed.status === "ready") {
    return {
      id,
      label: TOOL_LABEL[id],
      status: "ready",
      detail: probed.version,
    };
  }
  return {
    id,
    label: TOOL_LABEL[id],
    status: "missing",
    detail: "未安裝",
  };
}

const UNKNOWN: ToolStatusMap = {
  uv: { status: "missing" },
  git: { status: "missing" },
  node: { status: "missing" },
  pwsh: { status: "missing" },
};

/** Environment Lane：偵測／重新檢查／勾選後一次安裝與請重開終端。 */
export class EnvironmentLaneService {
  private statuses: ToolStatusMap = { ...UNKNOWN };
  private overlays: Partial<Record<EnvironmentToolId, Overlay>> = {};
  private selected: Record<EnvironmentToolId, boolean> = {
    uv: true,
    git: true,
    node: true,
    pwsh: true,
  };
  private selectionLocked = false;
  private readonly changeListeners = new Set<() => void>();

  private lastFailureDetail: string | undefined;

  constructor(
    private readonly probe: ProbeRunner,
    private readonly installDeps?: EnvironmentInstallDeps,
  ) {}

  onDidChange(listener: () => void): { dispose(): void } {
    this.changeListeners.add(listener);
    return {
      dispose: () => {
        this.changeListeners.delete(listener);
      },
    };
  }

  getLastFailureDetail(): string | undefined {
    return this.lastFailureDetail;
  }

  getView(): EnvironmentLaneView {
    return buildEnvironmentLaneView(
      this.statuses,
      this.overlays,
      this.selected,
      this.selectionLocked,
    );
  }

  toggleTool(tool: EnvironmentToolId): void {
    if (this.selectionLocked) {
      return;
    }
    this.selected[tool] = !this.selected[tool];
    this.notify();
  }

  async recheck(): Promise<void> {
    if (this.selectionLocked) {
      return;
    }
    const previousStatus = new Map(
      this.getView().tools.map((tool) => [tool.id, tool.status]),
    );
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
    const after = buildEnvironmentLaneView(this.statuses, this.overlays);
    for (const tool of after.tools) {
      if (previousStatus.get(tool.id) !== tool.status) {
        this.selected[tool.id] = defaultSelectedForStatus(tool.status);
      }
    }
    this.notify();
  }

  async installSelected(): Promise<EnvironmentInstallResult> {
    if (!this.installDeps) {
      return "unavailable";
    }
    if (this.selectionLocked) {
      return "busy";
    }
    const queued = TOOL_ORDER.filter((id) => this.selected[id]);
    if (queued.length === 0) {
      return "empty";
    }

    const wingetAvailable =
      this.installDeps.platform === "win32" &&
      this.installDeps.wingetAvailable
        ? await this.installDeps.wingetAvailable()
        : false;

    const items = queued.map((tool) => ({
      plan: resolveEnvironmentInstallPlan(tool, this.installDeps!.platform, {
        wingetAvailable,
      }),
      mode: this.confirmMode(tool),
    }));
    const confirm = buildEnvironmentInstallConfirm(items);
    this.selectionLocked = true;
    this.notify();
    const ok = await this.installDeps.confirm(confirm.title, confirm.detail);
    if (!ok) {
      this.selectionLocked = false;
      this.notify();
      return "cancelled";
    }

    let failed = false;
    for (const item of items) {
      const tool = item.plan.tool;
      this.overlays[tool] = { kind: "installing" };
      this.notify();
      const result = await this.installDeps.execute(item.plan);
      if (!result.ok) {
        const detail = `${result.detail} · ${IT_HINT}`;
        this.overlays[tool] = { kind: "failed", detail };
        this.selected[tool] = true;
        this.lastFailureDetail = detail;
        failed = true;
        break;
      }
      this.overlays[tool] = { kind: "needs-reopen-terminal" };
      this.selected[tool] = false;
    }

    this.selectionLocked = false;
    this.notify();
    return failed ? "failed" : "ran";
  }

  private confirmMode(
    tool: EnvironmentToolId,
  ): "missing" | "ready" | "needs-reopen-terminal" | "failed" {
    const overlay = this.overlays[tool];
    if (overlay?.kind === "needs-reopen-terminal") {
      return "needs-reopen-terminal";
    }
    if (overlay?.kind === "failed") {
      return "failed";
    }
    return this.statuses[tool].status === "ready" ? "ready" : "missing";
  }

  private notify(): void {
    for (const listener of this.changeListeners) {
      listener();
    }
  }
}
