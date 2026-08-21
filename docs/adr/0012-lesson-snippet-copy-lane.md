# Lesson Snippet 獨立第四區，只複製不執行

課堂還需要把起步程式交給學生，但不能跟 Install Action 混成「有的按鈕會跑終端、有的只複製」。我們決定：Course Catalog 新增頂層 `snippets`（必填 `id`／`title`／`body`，選填 `paste_hint`），側欄在本課安裝下方加 Snippet Lane「本課片段」。點選只把完整 `body` 寫入系統剪貼簿，不執行、不插入游標、不寫檔。全部片段一次列出，編號即清單順序。非法 `snippets` 整份 Catalog 失敗。Portal 存檔 normalize 本期只改 `vans_coding_router`（必須 round-trip `snippets`，不可只 dump `actions`）；`pegasi_router` 仍會默刪片段，直到另開票。

## Considered Options

- **第四種 Action Kind `snippet`**：安裝與複製混清單；否決。
- **寫入指定路徑／插入游標**：即先前不做的 File Asset，課堂焦點常在錯的檔；否決。
- **依進度解鎖或老師即時推送**：產品沒有進度通道，Catalog 也不輪詢；否決。
- **兩套 Router 同步改 normalize**：正確的長期契約，但本期只做 Vans。

## Consequences

- 擴充 parser、Course Lane 載入、側欄第四區、複製短訊見 `CONTEXT.md`（Lesson Snippet／Snippet Lane）。
- `vans_coding_router` 的 `normalize_course_catalog_yaml` 必須保留 `snippets`。
- Pegasi 課堂尚未能保存片段。
