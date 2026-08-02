import type { ActionRunSnapshot, ActionRunStatus } from "./actionRunState";
import { CATALOG_FILENAME, type CourseLaneView } from "./courseLaneTypes";
import type {
  EnvironmentLaneView,
  EnvironmentToolUiStatus,
} from "./environmentLane";
import type { EnvironmentToolId } from "./toolProbe";
import { buildSidebarShell } from "./sidebarShell";

export type SidebarEnvToolVm = {
  id: EnvironmentToolId;
  label: string;
  status: EnvironmentToolUiStatus;
  detail: string;
  actionLabel: "安裝" | "重新安裝／修復";
  busy: boolean;
  canRun: boolean;
};

export type SidebarCourseActionVm = {
  id: string;
  title: string;
  description?: string;
  status: ActionRunStatus;
  statusLabel: string;
  detail?: string;
  disabledReason?: string;
  actionLabel: string;
  busy: boolean;
  canRun: boolean;
};

export type SidebarViewModel = {
  title: string;
  workspaceLabel: string;
  hasCustomCommandInput: false;
  environment: {
    toolchainReady: boolean;
    badge: string;
    tip?: string;
    tools: SidebarEnvToolVm[];
  };
  course: {
    sourceLabel: string;
    emptyMessage?: string;
    actions: SidebarCourseActionVm[];
  };
};

export type BuildSidebarViewModelInput = {
  workspaceName: string;
  environment: EnvironmentLaneView;
  course: CourseLaneView;
};

/** 組裝側邊欄 Webview 用的唯讀畫面模型；狀態真相仍在各 Lane service。 */
export function buildSidebarViewModel(
  input: BuildSidebarViewModelInput,
): SidebarViewModel {
  const shell = buildSidebarShell(input.workspaceName);
  const env = input.environment;
  const badge = env.toolchainReady
    ? "Toolchain Ready：uv · git · Node 皆就緒"
    : `Toolchain Ready：未齊（uv ${readyMark(env, "uv")} · git ${readyMark(env, "git")} · Node ${readyMark(env, "node")}）`;

  return {
    title: shell.title,
    workspaceLabel: shell.workspaceLabel,
    hasCustomCommandInput: false,
    environment: {
      toolchainReady: env.toolchainReady,
      badge,
      ...(env.tip ? { tip: env.tip } : {}),
      tools: env.tools.map((tool) => {
        const busy = tool.status === "installing";
        return {
          id: tool.id,
          label: tool.label,
          status: tool.status,
          detail: tool.detail,
          actionLabel: tool.actionLabel,
          busy,
          canRun: !busy,
        };
      }),
    },
    course: buildCourseSection(input.course),
  };
}

function buildCourseSection(course: CourseLaneView): SidebarViewModel["course"] {
  const sourceLabel = `來自 ${CATALOG_FILENAME}`;
  if (course.kind === "no-workspace") {
    return {
      sourceLabel,
      emptyMessage: "請先開啟工作區資料夾",
      actions: [],
    };
  }
  if (course.kind === "missing" || course.kind === "invalid") {
    return {
      sourceLabel,
      emptyMessage: course.message,
      actions: [],
    };
  }
  if (course.actions.length === 0) {
    return {
      sourceLabel: `${sourceLabel}（actions 為空）`,
      emptyMessage: "Catalog 目前沒有可執行的本課動作",
      actions: [],
    };
  }
  return {
    sourceLabel,
    actions: course.actions.map((action) => {
      const busy = action.run.status === "running";
      const disabled = Boolean(action.disabledReason);
      return {
        id: action.id,
        title: action.title,
        ...(action.description ? { description: action.description } : {}),
        status: action.run.status,
        statusLabel: statusLabel(action.run),
        ...(action.run.detail ? { detail: action.run.detail } : {}),
        ...(action.disabledReason
          ? { disabledReason: action.disabledReason }
          : {}),
        actionLabel: actionCommandTitle(action.run),
        busy,
        canRun: !busy && !disabled,
      };
    }),
  };
}

function readyMark(view: EnvironmentLaneView, id: EnvironmentToolId): string {
  return view.tools.find((t) => t.id === id)?.status === "ready" ? "✓" : "✗";
}

function statusLabel(run: ActionRunSnapshot): string {
  switch (run.status) {
    case "running":
      return "進行中…（見終端機）";
    case "succeeded":
      return "成功";
    case "failed":
      return run.detail ?? "失敗";
    case "unverified":
      return run.detail ?? "已送出／未驗證";
    default:
      return "未執行";
  }
}

function actionCommandTitle(run: ActionRunSnapshot): string {
  switch (run.status) {
    case "succeeded":
      return "再執行";
    case "failed":
    case "unverified":
      return "重試";
    default:
      return "安裝";
  }
}
