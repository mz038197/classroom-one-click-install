# Classroom One-Click Install

課堂用編輯器擴充功能：學生點選項目以完成環境工具或本課安裝動作。此檔只記領域用語。

## Language

**Install Action**:
老師策展、學生可點的一筆安裝動作；含顯示名稱、必填的 Action Kind，以及背後要執行的指令意圖（例如 `uv add` 或 `uvx`），不必然等於 PyPI 套件短名。
_Avoid_: 模組（單獨使用時易與 Python module 混淆）, package name（暗示只是短名）

**Action Kind**:
標在單一 Install Action 上的封閉種類；YAML 欄位 `kind`，值為 `skill`／`package`／`mcp`，學生分別看到 tag「Skill」「套件」「MCP」。純顯示標示：不分區、不收合、不改變啟用／執行／依賴行為。缺漏或非法值則整份 Course Catalog 載入失敗。
_Avoid_: Action Group, 巢狀 groups, 依種類自動分區收合, 模組（單獨當領域詞或第四種 kind）, 開放任意字串 kind, 用 kind 驅動安裝邏輯

**Environment Tool**:
機器層級、固定清單的工具鏈成員（目前：uv、git、Node.js）；用來讓本課安裝動作跑得起來。
_Avoid_: 全域模組, 系統套件（太寬）

**Course Catalog**:
放在學生工作區根目錄的策展清單檔 `classroom-installs.yaml`，以頂層 `actions` 列出本課的 Install Action。
_Avoid_: 巢狀 `groups`（已撤回）, 遙控清單（MVP 不做）, 應用內建唯一清單, 多份清單（MVP 不做）

**Environment Lane**:
側邊欄中負責檢查／安裝 Environment Tool 的區塊；學生可整區收合／展開（與 Course Lane 並列的兩大區之一）。

**Course Lane**:
側邊欄中列出 Course Catalog 並觸發 Install Action 的扁平清單區塊；學生可整區收合／展開。不分依 Action Kind 的子區。

**Toolchain Ready**:
uv、git、Node.js 三者皆透過終端機偵測為可用（找得到指令且版本命令成功）的總覽狀態；與是否由本擴充功能安裝無關。不是 Course Lane 的總開關——本課動作改依各動作所需工具是否就緒來啟用。
_Avoid_: 環境安裝完成（未說明偵測基準）, 本擴充功能已執行安裝（不足以代表就緒）, 三工具未齊就不能裝任何本課項目

**Marketplace Install**:
VS Code 學生從 Visual Studio Marketplace 安裝本擴充功能的主路徑。
_Avoid_: 市集側載, Open VSX 安裝（本產品不上架 Open VSX）

**Sideload**:
以 `.vsix` 檔直接安裝擴充功能的備援路徑；用於 Cursor、離線、市集異常，或需固定某一版本時。
_Avoid_: 從市集安裝, 本機開發 Host（F5）當課堂安裝
