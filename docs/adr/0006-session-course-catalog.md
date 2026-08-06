# Course Catalog 以 Class Session 為權威來源（雙 Router）

學生不該自己放置 `classroom-installs.yaml`，老師也不該只靠教材 repo 發清單。我們決定：Course Catalog 的權威來源改為學生所連 **Router**（`vans_coding_router` 或 `pegasi_router`，由 `routerBaseUrl` 決定）上、該 Classroom API Key 所屬 **Class Session** 的 YAML；擴充以獨立 GET 拉取（與兌換解耦），在兌換成功、啟動且已有 key、以及手動重新載入／再試遠端時更新。成功結果只留擴充記憶體，不寫回工作區檔。擴充「手上沒有可用 YAML」時才 fallback 讀工作區根目錄 `classroom-installs.yaml`，並提示＋提供再試；遠端合法空清單（`actions: []`）不算失敗。老師在 Portal 以 YAML 文字區編輯，校验失敗拒存；新課堂預設空清單。本期不做 File Asset／新 Action Kind，也不把清單 UI 併進 Router Lane。`vans_coding_router` 與 `pegasi_router` 必須同契約實作，擴充不維護兩套 catalog 邏輯。此決策撤回先前「MVP 不做遙控清單、僅工作區 YAML」的假設。

## Considered Options

- **僅教材／工作區 YAML**：學生仍要自己放檔；否決為主路徑。
- **Catalog 只塞在 redeem 回應**：無法與重新載入／冷啟動共用同一 GET；改為獨立 GET。
- **遠端成功寫回專案 `classroom-installs.yaml`**：會默改學生檔案；否決。
- **新增 `asset` kind／一級檔案下載**：本期不做，進專案仍靠既有 `command`。
- **只改 Vans Router**：Pegasi 課堂會裂開；兩 Router 對等實作。

## Consequences

- `docs/spec.md` 與 Course Lane 載入路徑需改為「Session Catalog 優先、本機 fallback」。
- Router Portal／DB／`/extension/…` 需新增 catalog 儲存與 GET；兩邊 Router 同步上線。
- 信任邊界不變：執行前仍確認完整 `command`；遠端清單與本機清單同等對待。
