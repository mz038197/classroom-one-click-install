# Classroom one-click install — product spec

## Destination

產出一份可交接的產品規格：VS Code／Cursor 擴充功能，讓學生在側邊欄（1）一鍵檢查／安裝固定環境工具（uv、git、Node.js），（2）一鍵執行老師策展、寫在工作區設定檔裡的本課安裝動作（`uv add`／`uvx`，常含 git URL）。規格須寫到另一個 agent／開發者能依之開工；本地圖不實作擴充功能。

**目的地狀態：已達成** → [`docs/spec.md`](../../docs/spec.md)

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
- [Grilling: Course Catalog 設定檔要長什麼樣](./issues/03-grilling-catalog-schema.md) — 根目錄 `classroom-installs.yaml`；`actions[]` 必填 `id`/`title`/`command`、選填 `description`；整段命令、在工作區根執行。
- [Grilling: Environment Lane 的偵測與安裝行為](./issues/04-grilling-environment-lane-behavior.md) — 以終端機探測為準（含外部安裝）；顯示版本＋重新檢查＋可修復；裝完需重開終端再驗；Course Lane 依缺 uv／git 分段禁用（允許循序安裝，非三工具齊才開）。
- [Grilling: 擴充功能允許執行哪些命令](./issues/05-grilling-trust-boundary.md) — 僅環境固定流程＋工作區 catalog；catalog 命令不白名單；每次確認顯示完整 command；無學生自訂命令。
- [Grilling: git+https 依賴在課堂上的認證假設](./issues/06-grilling-git-https-auth.md) — MVP 假設公開 HTTPS repo；失敗給短提示＋終端機原文；不做私有／SSH／gh 登入引導。
- [Prototype: 側邊欄資訊架構草圖](./issues/07-prototype-sidebar-ia.md) — 採變體 A（環境在上、本課在下）；確認框／重開終端／禁用／成敗狀態見原型檔。
- [Grilling: 產品規格大綱與完成定義](./issues/08-grilling-spec-outline-dod.md) — 規格在 `docs/spec.md`；十章大綱；DoD＝寫齊並鏈結決策／≥5 驗收條，不實作擴充功能。
- [Task: 撰寫 docs/spec.md](./issues/09-task-write-spec.md) — 已交付十章規格與 8 條驗收標準於 `docs/spec.md`。

## Not yet specified


- 校園網／proxy／離線時，git＋uv 安裝動作怎麼降級或提示
- 多根工作區（multi-root）要以哪個資料夾當「目前專案」
- 市集上架文案、圖示、擴充功能 id／顯示名稱
- 介面語言（僅繁中／可英）
- 安裝失敗後的重試／部分成功（例如三個動作點了兩個）的產品規則


## Out of scope

- 在本地圖內實作或發佈擴充功能（目的地止於規格）
- 學生任意搜尋並安裝 PyPI／npm 套件
- MVP 保證 Linux
- Course Lane 的 npm／pnpm／yarn 安裝動作
- 把 `uv tool install` 列為 MVP 必備（除非後續票納入）
- MVP 私有 git repo 認證、SSH 改寫、`gh auth` 產品內引導（見 git 認證票）
