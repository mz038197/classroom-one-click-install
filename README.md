# vans-classroom-install（凡思課堂安裝）

課堂用 VS Code／Cursor 擴充功能：學生在側邊欄一鍵完成環境工具（uv／git／Node）與老師策展的本課安裝動作（uv add／uvx）。

擴充功能 id：`vans-coding.vans-classroom-install`。

- **規格（開工用）**：[`docs/spec.md`](./docs/spec.md)
- **實作票（MVP）**：[`.scratch/mvp-extension/`](./.scratch/mvp-extension/README.md)
- 領域用語：[`CONTEXT.md`](./CONTEXT.md)
- Wayfinder 地圖：[`.scratch/classroom-one-click-install/map.md`](./.scratch/classroom-one-click-install/map.md)
- 示例 Course Catalog：[`samples/classroom-installs.yaml`](./samples/classroom-installs.yaml)

## 課堂使用（VSIX 側載）

MVP **發佈路徑是 VSIX 側載**（不上架市集）。老師打包後把 `.vsix` 與示例 catalog 交給學生即可，學生無需本機開發環境。

### 老師：打包 VSIX

```bash
npm install
npm run package
```

此指令會編譯並以 `@vscode/vsce` 打包（已驗證：成功時根目錄出現 `.vsix`）。產物名稱為 `vans-classroom-install-<version>.vsix`（例如 `vans-classroom-install-0.0.1.vsix`；`*.vsix` 已列在 `.gitignore`，請自行發放，不必提交）。將該檔與 `samples/classroom-installs.yaml`（或本課自訂 catalog）一併交給學生。

### 學生／老師：安裝擴充功能

1. 取得 `.vsix` 檔。
2. 在 **VS Code**：命令面板 → `Extensions: Install from VSIX…` → 選檔。  
   在 **Cursor**：同樣走「從 VSIX 安裝」；若介面用語不同，到 Extensions 視圖找 Install from VSIX。
3. 重新載入視窗（若提示）。
4. 活動列應出現「凡思課堂安裝」。

### 學生：本課 Catalog

1. 把 `classroom-installs.yaml` 放到**工作區根目錄**（可直接用 repo 內示例，或老師改過的版本）。
2. 側邊欄上方為 Environment Lane（uv／git／Node）：未就緒就「安裝」，裝完依提示**重開終端**再「重新檢查」。
3. 下方 Course Lane 會列出本課動作；點選 → 確認完整 command → 在整合終端機執行。

### Cursor 相容

文件**不保證** Cursor 與 VS Code 行為完全一致；課堂前請在目標 Cursor 版本**實測**側載、側邊欄、終端機執行與重新檢查。MVP 以 VS Code 擴充功能 API 為準，發佈仍為 VSIX 側載。

## 開發

```bash
npm install
npm run compile
npm test
```

在 VS Code／Cursor 按 F5（`Run Extension`）開 Extension Development Host；活動列應出現「凡思課堂安裝」側邊欄（Webview：Environment Lane 在上、Course Lane 在下）。

工作區根目錄放置 `classroom-installs.yaml` 後，Course Lane 會列出本課 Install Action；點選會先確認完整 command，再於整合終端機執行。
