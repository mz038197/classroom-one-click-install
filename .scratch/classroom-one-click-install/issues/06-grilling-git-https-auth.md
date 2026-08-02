# Grilling: git+https 依賴在課堂上的認證假設

Type: grilling
Status: resolved

## Question

本課 Install Action 常使用 `git+https://github.com/…`。規格應假設學生機器上 git 認證／GitHub 存取是什麼狀態（僅公開 repo、已登入 gh、credential helper、SSH 改寫等）？缺失認證時 Environment／Course Lane 應如何提示，才不會變成「點了就失敗、不知為何」？

## Answer

### 假設（MVP）

- 本課 `git+https://…` 依賴預設為**公開 repo**；學生**不需** GitHub 登入、PAT、`gh auth` 或 SSH。
- 前置條件仍是：本機 `git` 就緒（Environment Lane 偵測），以及網路可達。

### 失敗時（Course Lane）

- 側邊欄標失敗，並給**短提示**（可多選呈現，依情況）：
  - 檢查 git 是否就緒（必要時引導去 Environment Lane）
  - 檢查網路／校園防火牆
  - 確認遠端 repo 是否仍為公開（404／permission denied 時）
- **一定保留**終端機完整輸出供對照。
- **不做**互動式登入／token 蒐集 UI。

### 明確不進 MVP

- 私有 repo 認證流程
- SSH URL 改寫或 SSH agent 引導
- `gh auth login` 產品內引導

（若日後教材改私有，另開票擴規格；不在本地圖默默納入。）
