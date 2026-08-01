# Classroom one-click install — product spec

## Destination

產出一份可交接的產品規格：VS Code／Cursor 擴充功能，讓學生在側邊欄（1）一鍵檢查／安裝固定環境工具（uv、git、Node.js），（2）一鍵執行老師策展、寫在工作區設定檔裡的本課安裝動作（`uv add`／`uvx`，常含 git URL）。規格須寫到另一個 agent／開發者能依之開工；本地圖不實作擴充功能。

## Notes

- **Domain glossary**: [CONTEXT.md](../../CONTEXT.md)
- **Skills**: `/grilling`, `/domain-modeling`, `/research`, `/prototype`（原型票時）
- **Tracker**: local markdown under `.scratch/classroom-one-click-install/` (see `docs/agents/issue-tracker.md`)
- **Standing preferences from charting**（尚未成票之決議，後續票不得無故違背；若要改須另開票推翻）:
  - 交付物是**產品規格**，不是實作
  - 形態：VS Code／Cursor **擴充功能**
  - 同一產品兩條通道：Environment Lane ＋ Course Lane
  - Environment Tools 固定：uv、git、Node.js
  - Course Lane：老師策展；**不做**任意搜尋 PyPI／npm
  - Course 安裝器 MVP：`uv add` 與 `uvx`（含 `git+https`、旗標如 `--upgrade` / `--update`）；**不做**本課 `npm i`
  - Node 只出現在 Environment Lane
  - Course Catalog 住在**專案內設定檔**
  - 執行時：整合終端機跑指令；側邊欄同步進行中／成功／失敗
  - OS：Windows ＋ Mac（Linux 非 MVP）
  - 發佈：長遠市集；課堂 MVP 先 **VSIX 側載**

## Decisions so far

- [Research: VS Code 擴充功能終端機執行與側邊欄狀態 API](./issues/02-research-vscode-terminal-sidebar-apis.md) — Shell Integration 可回傳命令 exit code 並驅動狀態；`sendText` fallback 僅能標示已送出／未驗證，需可靠結果時採 Task。
- [Research: uv／git／Node 在 Windows 與 Mac 的偵測與安裝路徑](./issues/01-research-toolchain-install-win-mac.md) — 預設官方 uv standalone、Win Git installer／Mac Xcode CLT、Node LTS installer；安裝後重開終端機再以版本指令驗證。

## Not yet specified

- 校園網／proxy／離線時，git＋uv 安裝動作怎麼降級或提示
- 多根工作區（multi-root）要以哪個資料夾當「目前專案」
- 市集上架文案、圖示、擴充功能 id／顯示名稱
- 介面語言（僅繁中／可英）
- Catalog 檔名與是否允許一工作區多份清單（細項由 schema 票帶出一部分）
- 安裝失敗後的重試／部分成功（例如三個動作點了兩個）的產品規則

## Out of scope

- 在本地圖內實作或發佈擴充功能（目的地止於規格）
- 學生任意搜尋並安裝 PyPI／npm 套件
- MVP 保證 Linux
- Course Lane 的 npm／pnpm／yarn 安裝動作
- 把 `uv tool install` 列為 MVP 必備（除非後續票納入）
