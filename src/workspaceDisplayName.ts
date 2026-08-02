export type WorkspaceFolderRef = {
  name: string;
};

/** 側邊欄顯示用的工作區識別（多根時採第一個資料夾，規格尚未定案）。 */
export function workspaceDisplayName(
  folders: readonly WorkspaceFolderRef[] | undefined,
): string {
  const first = folders?.[0];
  if (!first) {
    return "無工作區";
  }
  return first.name;
}
