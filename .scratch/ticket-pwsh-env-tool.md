## Parent

#5

## What to build

學生在 Environment Lane 看到四個 Environment Tool，順序為 uv、git、Node.js、PowerShell 7。PowerShell 7 只在整合終端探測到 `pwsh` 的可解析版本行才就緒，系統 PowerShell 5.1 不算。Toolchain Ready 要四個都就緒。Windows 有 winget 時，Git、Node、PowerShell 7 用同一組安靜旗標安裝（含 source winget、disable-interactivity、silent、兩條 accept）；沒有 winget 則開官方頁。macOS 上 PowerShell 7 開啟 Microsoft Learn〈Install PowerShell on macOS〉，不走 Homebrew、擴充不 sudo。uv 仍走 Astral 官方腳本。本票仍保留每一列的單項安裝（下一個票才改成勾選批次）。更新 glossary 與 ADR：四件套、Ready 含 pwsh、Mac 為何開頁、winget 為何三條都加 silent 旗標。Course Lane 不因缺 pwsh 而鎖。

## Acceptance criteria

- [ ] 清單與探測順序固定為 uv → git → Node.js → PowerShell 7
- [ ] `pwsh` 有可解析版本行則 PowerShell 7 就緒；僅有 `powershell.exe` 則未安裝
- [ ] Toolchain Ready 僅在四個皆就緒時為真
- [ ] Windows 有 winget：Git.Git、OpenJS.NodeJS.LTS、Microsoft.PowerShell 的安裝命令含 `--source winget --disable-interactivity -h` 與既有 accept 旗標
- [ ] Windows 無 winget：該三項為開啟官方頁；uv 仍為 Astral 腳本
- [ ] macOS PowerShell 7 為開啟 Learn 安裝頁，不是 brew 或 sudo tar
- [ ] macOS uv／git／Node 安裝路徑不變
- [ ] 單列安裝 PowerShell 7 成功後狀態為請重開終端，不是直接就緒
- [ ] 官方安裝器明確 already installed 仍視為本次成功並請重開終端
- [ ] glossary／ADR 已寫四件套與上述路徑取捨
- [ ] 缺 PowerShell 7 時本課 Install Action 仍可執行

## Blocked by

None — can start immediately.
