# Environment Tool 含 PowerShell 7；Ready 認 `pwsh`；Mac 開 Learn；winget 三條同安靜旗標

課堂要的是 PowerShell 7（`pwsh`），不是 Windows 內建 5.1。Environment Lane 固定四件套、順序 uv → git → Node.js → PowerShell 7。Toolchain Ready 要四個都探測到可解析版本行；`powershell.exe` 的 5.1 輸出不能讓 PowerShell 7 就緒。Course Lane 仍不因缺 `pwsh` 而鎖（延續 [ADR 0010](./0010-course-lane-ungated-by-environment-tools.md)）。本期仍是每列單項安裝。

Windows 有 winget 時，Git、Node、PowerShell 7 用同一組安靜旗標（`--source winget --disable-interactivity -h` 加上既有兩條 accept）。沒有 winget 則開官方說明／下載頁。uv 仍走 Astral 官方腳本。macOS 的 PowerShell 7 開啟 Microsoft Learn〈Install PowerShell on macOS〉，不走 Homebrew、擴充不組 `sudo tar`：晶片要學生自己選 .pkg，系統安裝器本來就要管理員密碼，擴充提權也過不了 MDM。

## Considered Options

- **把系統 PowerShell 5.1 當就緒**：否決。課堂契約是 `pwsh`。
- **macOS 用 brew 或終端 `sudo tar`**：否決。與既有 Mac 路徑（不 Homebrew、不提權）衝突。
- **只給 Git／Node 加 silent、PowerShell 7 走互動安裝器**：否決。同一條 winget 路徑三套件應同一組旗標；UAC 該出仍會出。

## Consequences

- 探測命令為 `pwsh --version`；unix 前綴與 uv／git 相同，nvm 仍只接 Node。
- 無 winget 的 Windows PowerShell 7 開 Learn〈Install PowerShell on Windows〉。
- glossary 與 spec 的 Environment Tool／Toolchain Ready 改為四件套。
