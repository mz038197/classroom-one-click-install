# Windows／macOS：uv、Git、Node.js 安裝研究

日期：2026-08-01  
範圍：Environment Lane 的 Windows 與 macOS MVP；只採官方工具或 OS 廠商文件。

## 結論：規格的預設路徑

| 工具 | Windows 預設 | macOS 預設 |
| --- | --- | --- |
| uv | Astral standalone PowerShell installer | Astral standalone shell installer |
| Git | Git for Windows 官方 installer | Xcode Command Line Tools |
| Node.js | Node.js 官方 **LTS** `.msi` installer | Node.js 官方 **LTS** `.pkg` installer |

這三條路徑不應假設無權限或不需確認：擴充功能要先顯示實際指令／下載頁、說明會啟動系統安裝器或執行遠端官方安裝腳本，並讓學生確認。每次安裝完成後，必須要求「重新開啟整合終端機」再重新偵測；PATH 與 shell 設定不保證會回寫到已存在的終端機程序。

Node.js 一律選當時下載頁標示的 LTS，不固定主版號；Node.js 官方說明 LTS 適合 production，並提供約 30 個月的關鍵修正支援。[Node.js Releases](https://nodejs.org/en/about/previous-releases)

## 偵測契約

在目前的整合終端機中逐一執行；「指令存在」和「版本可執行」都成功才是 available。不要由檔案路徑或 GUI 是否安裝來判定。

| OS | uv | Git | Node.js |
| --- | --- | --- | --- |
| Windows PowerShell | `Get-Command uv -ErrorAction SilentlyContinue; uv --version` | `Get-Command git -ErrorAction SilentlyContinue; git --version` | `Get-Command node -ErrorAction SilentlyContinue; node --version; npm --version` |
| macOS shell | `command -v uv && uv --version` | `command -v git && git --version` | `command -v node && node --version && npm --version` |

- 任一工具找不到或版本命令非零結束，就顯示該工具為「未就緒」；Node 必須同時驗 `node` 與 bundled `npm`，避免只有殘留 shim。
- `git --version` 是 Git CLI 所列的正式版本選項；Node.js CLI 使用 `node [options]`，下載版內含 Node runtime。［[Git CLI](https://git-scm.com/docs/git)、[Node.js CLI](https://nodejs.org/api/cli.html)、[Node.js Download](https://nodejs.org/en/download)］
- macOS 的 `command not found` 即表示 shell 沒有在 PATH 的已知目錄中找到可執行檔；Apple 說明 shell 以 PATH 的已知目錄尋找命令。［[Apple Terminal](https://support.apple.com/guide/terminal/execute-commands-and-run-tools-apdb66b5242-0d18-49fc-9c47-a2498b7c91d5/mac)］

## uv

### Windows

**預設：官方 standalone installer**

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

- Astral 列出此命令為 Windows standalone installer；它會暫時以 `ByPass` 允許執行從網路取得的腳本。產品 UI 必須清楚告知此事，並提供「先檢視腳本」的安全替代指令。［[uv 安裝](https://docs.astral.sh/uv/getting-started/installation/)］
- 取捨：這是跨環境最少前置需求的預設，但依賴網路與 PowerShell 執行策略。安裝／日後 `uv self update` 可能修改 shell profile；新終端機再驗證。［[uv 安裝](https://docs.astral.sh/uv/getting-started/installation/)］
- 備選：已有 WinGet 的受管理電腦可用 `winget install --id=astral-sh.uv -e`。WinGet 可能依套件 scope 觸發 UAC，故不可承諾學生帳號必定免管理員。［[uv 安裝](https://docs.astral.sh/uv/getting-started/installation/)、[Microsoft WinGet troubleshooting](https://learn.microsoft.com/en-us/windows/package-manager/winget/troubleshooting)］

### macOS

**預設：官方 standalone installer**

```sh
curl -LsSf https://astral.sh/uv/install.sh | sh
```

- Astral 官方提供這條 macOS 命令，並提供 `curl … | less` 讓使用者先檢視腳本。它安裝至使用者家目錄的可執行位置（官方卸載範例為 `~/.local/bin/uv`），通常不需要 `sudo`；仍須由重新開啟的 shell 驗證 PATH。［[uv 安裝](https://docs.astral.sh/uv/getting-started/installation/)］
- 備選：已使用 Homebrew 者可選 `brew install uv`；使用該路徑時更新責任在 package manager，而非 `uv self update`。［[uv 安裝](https://docs.astral.sh/uv/getting-started/installation/)］

## Git

### Windows

**預設：Git for Windows 官方 installer**

- 從 [Git for Windows 官方下載頁](https://git-scm.com/install/windows) 開啟對應架構的 setup，完成後重開整合終端機並重新偵測。
- 取捨：這是 Git 網站所列的官方維護 build，最適合不預先假定有任何 package manager 的課堂機器；安裝器若選機器層級或受校園政策限制，可能出現 UAC／需要 IT 管理員，不能由擴充功能繞過。
- 備選：已有 WinGet 時使用 `winget install --id Git.Git -e --source winget`。這是 Git 官方下載頁明列的命令，但同樣受 WinGet 可用性、安裝 scope 與 UAC 影響。［[Git for Windows](https://git-scm.com/install/windows)、[Microsoft WinGet troubleshooting](https://learn.microsoft.com/en-us/windows/package-manager/winget/troubleshooting)］
- 不選 portable 作預設：官方頁將它列為 thumbdrive edition；它無法保證跨重新開啟終端機的 PATH 可用性。［[Git for Windows](https://git-scm.com/install/windows)］

### macOS

**預設：Xcode Command Line Tools**

```sh
xcode-select --install
```

- Git 官方明載 Apple 透過 Xcode Command Line Tools 提供 Git，並指定這條安裝命令。這可與 Apple 平台整合，不需預裝 Homebrew。［[Git for macOS](https://git-scm.com/install/mac)］
- 取捨：會跳出 macOS 系統安裝流程，受網路、裝置管理或管理員授權限制；擴充功能只能啟動命令／引導，不能靜默完成。Apple 說明需要管理員權限的操作會要求管理員帳號密碼。［[Apple administrator commands](https://support.apple.com/guide/terminal/enter-administrator-commands-apd5b0b6259-a7d4-4435-947d-0dff528912ba/mac)］
- 備選：已管理 Homebrew 的進階使用者可 `brew install git`。Git 官方特別提醒 macOS 非 source distributions 由第三方提供，可能未同步最新 Git；因此不作教室預設。［[Git for macOS](https://git-scm.com/install/mac)］

## Node.js

### Windows 與 macOS

**預設：Node.js 官網當期 LTS installer**

- 從 [Node.js Download](https://nodejs.org/en/download) 選 LTS 與正確平台架構：Windows 使用 `.msi`，macOS 使用 `.pkg`。官方 release archive 明列 Windows x64／ARM64 `.msi` 與 macOS x64／ARM64 `.pkg`。［[Node.js archive 範例](https://nodejs.org/en/download/archive/v24.18.1)］
- 取捨：官方 installer 最適合一次性教室設定，不依賴先有 Homebrew、nvm 或其他版本管理器；它是系統安裝器，可能要求 admin/UAC 或被 MDM 政策攔下。完成後重開整合終端機，再同時驗 `node --version` 和 `npm --version`。
- 不選版本管理器作 MVP 預設：Node.js 官方將 package managers 與 version managers 視為多種安裝方法；它們適合需要切換版本的進階需求，但會增加要選 manager、設定 shell 與 PATH 的支援面。［[Node.js Releases—official/community methods](https://nodejs.org/en/about/previous-releases)］
- 備選：若學校已標準化特定 package manager 或 version manager，可由產品規格提供「由 IT 管理」的外連說明；MVP 不應自動挑選或混用它們。

## 對產品規格的可執行要求

1. 每工具卡先執行偵測契約，並把 command、stdout/stderr、exit code 顯示為可複製診斷資訊。
2. 「安裝」先要求確認；執行外部 installer／系統 dialog／遠端 script 後，狀態為「等待重新開啟終端機」，不是直接成功。
3. 提供「重新檢查」；只有版本命令成功才標記 ready。PATH 未更新時不要自動編輯使用者或系統 PATH，改顯示該工具官方／系統建議的後續操作。
4. 權限或 MDM 拒絕時，保留完整錯誤，提示學生向 IT 取得管理員協助；不要嘗試提權或繞過 policy。
