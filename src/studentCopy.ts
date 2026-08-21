/** When Host state.vscdb stays busy after the wait budget. */
export function clearClassroomConnectionBusyMessage(): string {
  return "無法清除課堂連線（本機忙碌）。請重新啟動後再試一次清除。";
}

/** Label shown beside the Copy Classroom API Key icon. */
export const CLASSROOM_API_KEY_LABEL = "Classroom API Key";

/** Suffix after the copy icon in the ready detail row. */
export const CLASSROOM_API_KEY_READY_SUFFIX = " 已設定。";

/** Router Lane ready detail after redeem or secret restore. */
export function classroomApiKeyReadyDetail(): string {
  return `${CLASSROOM_API_KEY_LABEL}${CLASSROOM_API_KEY_READY_SUFFIX}`;
}

export function copyClassroomApiKeySuccessMessage(): string {
  return "已複製 Classroom API Key。請勿分享給不信任的人。";
}

export function copyClassroomApiKeyFailureMessage(): string {
  return "無法複製 Classroom API Key。請重新連線後再試。";
}

export function copyLessonSnippetSuccessMessage(title: string): string {
  return `已複製「${title}」。`;
}

export function copyLessonSnippetFailureMessage(): string {
  return "無法複製本課片段。";
}
