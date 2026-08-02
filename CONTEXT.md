# Classroom One-Click Install

課堂用編輯器擴充功能：學生點選項目以完成環境工具或本課安裝動作。此檔只記領域用語。

## Language

**Install Action**:
老師策展、學生可點的一筆安裝動作；含顯示名稱與背後要執行的指令意圖（例如 `uv add` 或 `uvx`），不必然等於 PyPI 套件短名。
_Avoid_: 模組（單獨使用時易與 Python module 混淆）, package name（暗示只是短名）

**Environment Tool**:
機器層級、固定清單的工具鏈成員（目前：uv、git、Node.js）；用來讓本課安裝動作跑得起來。
_Avoid_: 全域模組, 系統套件（太寬）

**Course Catalog**:
放在學生工作區根目錄的策展清單檔 `classroom-installs.yaml`，以 `actions` 列出本課的 Install Action。
_Avoid_: 遙控清單（MVP 不做）, 應用內建唯一清單, 多份清單（MVP 不做）

**Environment Lane**:
側邊欄中負責檢查／安裝 Environment Tool 的區塊。

**Course Lane**:
側邊欄中列出 Course Catalog 並觸發 Install Action 的區塊。

**Toolchain Ready**:
uv、git、Node.js 三者皆透過終端機偵測為可用（找得到指令且版本命令成功）的總覽狀態；與是否由本擴充功能安裝無關。不是 Course Lane 的總開關——本課動作改依各動作所需工具是否就緒來啟用。
_Avoid_: 環境安裝完成（未說明偵測基準）, 本擴充功能已執行安裝（不足以代表就緒）, 三工具未齊就不能裝任何本課項目

**Marketplace Install**:
VS Code 學生從 Visual Studio Marketplace 安裝本擴充功能的主路徑。
_Avoid_: 市集側載, Open VSX 安裝（本產品不上架 Open VSX）

**Sideload**:
以 `.vsix` 檔直接安裝擴充功能的備援路徑；用於 Cursor、離線、市集異常，或需固定某一版本時。
_Avoid_: 從市集安裝, 本機開發 Host（F5）當課堂安裝
