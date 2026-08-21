# Grilling: macOS 假未安裝與已裝卻安裝失敗

Type: grilling
Status: resolved
Blocked by: 04

## Question

Mac 上學生在 VS Code 整合終端打得到 `git --version`／`uv --version`，Environment Lane 仍顯示「未安裝」；按安裝（尤其 git 的 `xcode-select --install`）在 CLT 已存在時以結束碼 1 失敗。探測與安裝的產品契約應如何修正，且不違背 ADR 0005（對齊 VS Code 整合終端）與票 04（裝完不直接標就緒）？

## Answer

1. **就緒標準**：維持 ADR 0005——新開 VS Code 整合終端看得到版本，重新檢查就要顯示版本。不追 conda／mise／只在終端機.app 才有的 PATH。
2. **狀態模型**：不新增 unknown。仍為就緒／未安裝／請重開終端／安裝失敗。
3. **版本行**：stdout 有可解析版本行即就緒，即使結束碼不是 0。對不上（橫幅、`uv --version` 回音、空輸出）仍是未安裝。
4. **探測等待**：與安裝相同，等 Shell Integration 4 秒；仍等不到才走 `$SHELL -lc` 後備。不改成 `-lic`、不硬 source `.zshrc`。
5. **nvm**：只接在 Node 探測。uv／git 只補 `~/.local/bin`、Homebrew 路徑。
6. **已裝好**：官方安裝器明確 already installed → 本次流程成功 → 請重開終端。不當失敗、不直接標就緒。禁止把泛用結束碼 1 當成已安裝。這次實作認 Mac git `xcode-select --install` 的 already installed 文案。

決策紀錄：[ADR 0011](../../../docs/adr/0011-environment-probe-version-and-already-installed.md)
