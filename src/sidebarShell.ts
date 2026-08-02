export type SidebarLaneId = "environment" | "course";

export type SidebarLane = {
  id: SidebarLaneId;
  title: string;
  placeholder: string;
};

export type SidebarShell = {
  title: string;
  workspaceLabel: string;
  lanes: readonly [SidebarLane, SidebarLane];
  /** 信任邊界：UI 永不提供學生自訂命令輸入。 */
  hasCustomCommandInput: false;
};

/** 變體 A 側邊欄殼：Environment Lane 在上、Course Lane 在下。 */
export function buildSidebarShell(workspaceName: string): SidebarShell {
  return {
    title: "課堂一鍵安裝",
    workspaceLabel: `工作區：${workspaceName}`,
    lanes: [
      {
        id: "environment",
        title: "環境工具",
        placeholder: "uv／git／Node.js 偵測與重新檢查",
      },
      {
        id: "course",
        title: "本課安裝",
        placeholder: "來自 classroom-installs.yaml",
      },
    ],
    hasCustomCommandInput: false,
  };
}
