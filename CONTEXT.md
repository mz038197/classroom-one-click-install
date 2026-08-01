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
放在學生工作區內的策展清單檔，列出本課的 Install Action。
_Avoid_: 遙控清單（MVP 不做）, 應用內建唯一清單

**Environment Lane**:
側邊欄中負責檢查／安裝 Environment Tool 的區塊。

**Course Lane**:
側邊欄中列出 Course Catalog 並觸發 Install Action 的區塊。

**Toolchain Ready**:
Environment Tool 皆已偵測為可用（在 PATH 上可執行）的狀態。
_Avoid_: 環境安裝完成（未說明偵測基準）
