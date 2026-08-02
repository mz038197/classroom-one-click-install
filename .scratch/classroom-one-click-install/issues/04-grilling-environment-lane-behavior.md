# Grilling: Environment Lane 的偵測與安裝行為

Type: grilling
Status: resolved
Blocked by: 01

## Question

側邊欄 Environment Lane 對 uv／git／Node.js 的產品行為應是什麼：如何判定 Toolchain Ready、點「安裝」時跑什麼、已安裝是否顯示版本、失敗或需重開終端機時如何提示、是否允許「重新安裝／修復」？決策須與 [Research: uv／git／Node 在 Windows 與 Mac 的偵測與安裝路徑](./01-research-toolchain-install-win-mac.md) 的事實相容。

## Answer

### 偵測（與是否用本擴充功能安裝無關）

- 以整合終端機執行研究檔的偵測契約（找得到指令＋版本命令成功）判定各工具狀態。
- **不**記錄「是否由本擴充功能安裝」；學生在 VS Code **外**的終端機／系統安裝器裝好，只要 PATH 對目前終端機可見，按「重新檢查」即可變成就緒並顯示版本。
- 若剛在外部裝完，舊終端可能仍看不到 → 提示新開／重開整合終端後再重新檢查。

### 側邊欄狀態

- 每工具：就緒顯示版本號；未就緒顯示「未安裝」。
- 提供「重新檢查」。
- 就緒時仍保留「重新安裝／修復」（走同一套安裝流程）。

### 安裝流程（僅 Environment Lane）

1. 學生確認（須揭示會跑遠端腳本／開系統安裝器等風險）。
2. 執行該 OS 的預設安裝路徑（見研究票：uv standalone、Win Git installer／Mac Xcode CLT、Node LTS installer）。
3. 狀態改為「請重開終端機」，**不要**直接標成功。
4. 學生重開終端 → 重新檢查 → 版本成功才就緒。
5. 權限／MDM 失敗：保留錯誤，提示找 IT；不嘗試提權。

### 與 Course Lane 的邊界

- 「請重開終端機」**只**用於環境工具；本課 `uv add`／`uvx` **不**要求重開終端。
- 學生可**循序**安裝環境工具；**不要**要求三個都就緒才開放整個 Course Lane。
- Course Lane 採**依依賴禁用**：
  - 缺 `uv` → 禁用 `command` 以 `uv`／`uvx` 開頭（或同等）的本課動作
  - 缺 `git` → 禁用 `command` 含 `git+`（或明顯需 git）的本課動作
  - `Node` 不作為本課清單的鎖定條件（本課 MVP 無 npm 動作）
- 仍可顯示「建議安裝尚缺的環境工具」軟提示，但不一刀切鎖死全部按鈕。
- **Toolchain Ready**（三工具皆就緒）可當總覽狀態／徽章，**不是** Course Lane 的總開關。

安裝指令與信任提示的細節與 Course Catalog 命令防護，另見信任邊界票。
