import type { ActionRunSnapshot, ActionRunStatus } from "./actionRunState";
import { actionKindLabel, type ActionKind } from "./courseCatalog";
import type { CourseLaneView } from "./courseLaneTypes";
import type {
  EnvironmentLaneView,
  EnvironmentToolUiStatus,
} from "./environmentLane";
import type { RouterLaneView } from "./routerLaneService";
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
  kind: ActionKind;
  kindLabel: string;
  description?: string;
  status: ActionRunStatus;
  statusLabel: string;
  detail?: string;
  disabledReason?: string;
  actionLabel: string;
  busy: boolean;
  canRun: boolean;
};

export type SidebarRouterVm = {
  status: RouterLaneView["status"];
  statusLabel: string;
  inviteCode: string;
  detail: string;
  classLabel?: string;
  canOpenSignIn: boolean;
  canRedeem: boolean;
  signInLabel: string;
  redeemLabel: string;
};

export type SidebarViewModel = {
  title: string;
  workspaceLabel: string;
  hasCustomCommandInput: false;
  router: SidebarRouterVm;
  environment: {
    toolchainReady: boolean;
    badge: string;
    tip?: string;
    tools: SidebarEnvToolVm[];
  };
  course: {
    emptyMessage?: string;
    actions: SidebarCourseActionVm[];
  };
};

export type BuildSidebarViewModelInput = {
  workspaceName: string;
  router: RouterLaneView;
  environment: EnvironmentLaneView;
  course: CourseLaneView;
};

/** 組裝側邊欄 Webview 用的唯讀畫面模型；狀態真相仍在各 Lane service。 */
export function buildSidebarViewModel(
  input: BuildSidebarViewModelInput,
): SidebarViewModel {
  const shell = buildSidebarShell(input.workspaceName);
  const env = input.environment;
  const badge = env.toolchainReady ? "環境工具皆就緒" : "環境工具未齊";
  const router = input.router;

  return {
    title: shell.title,
    workspaceLabel: shell.workspaceLabel,
    hasCustomCommandInput: false,
    router: {
      status: router.status,
      statusLabel: routerStatusLabel(router.status),
      inviteCode: router.inviteCode,
      detail: router.detail,
      ...(router.classLabel ? { classLabel: router.classLabel } : {}),
      canOpenSignIn: router.canOpenSignIn,
      canRedeem: router.canRedeem,
      signInLabel: "登入 Google",
      redeemLabel: "兌換並設定",
    },
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

function routerStatusLabel(status: RouterLaneView["status"]): string {
  switch (status) {
    case "awaiting_sign_in":
      return "等待登入";
    case "busy":
      return "處理中";
    case "ready":
      return "已設定";
    case "error":
      return "失敗";
    default:
      return "尚未設定";
  }
}

function buildCourseSection(course: CourseLaneView): SidebarViewModel["course"] {
  if (course.kind === "no-workspace") {
    return {
      emptyMessage: "請先開啟工作區資料夾",
      actions: [],
    };
  }
  if (course.kind === "missing" || course.kind === "invalid") {
    return {
      emptyMessage: course.message,
      actions: [],
    };
  }
  if (course.actions.length === 0) {
    return {
      emptyMessage: "Catalog 目前沒有可執行的本課動作",
      actions: [],
    };
  }
  return {
    actions: course.actions.map((action) => {
      const busy = action.run.status === "running";
      const disabled = Boolean(action.disabledReason);
      return {
        id: action.id,
        title: action.title,
        kind: action.kind,
        kindLabel: actionKindLabel(action.kind),
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
