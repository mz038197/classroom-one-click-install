# classroom-one-click-install

課堂用 VS Code／Cursor 擴充功能：學生在側邊欄一鍵完成環境工具（uv／git／Node）與老師策展的本課安裝動作（uv add／uvx）。

- **規格（開工用）**：[`docs/spec.md`](./docs/spec.md)
- **實作票（MVP）**：[`.scratch/mvp-extension/`](./.scratch/mvp-extension/README.md)
- 領域用語：[`CONTEXT.md`](./CONTEXT.md)
- Wayfinder 地圖：[`.scratch/classroom-one-click-install/map.md`](./.scratch/classroom-one-click-install/map.md)

## 開發

```bash
npm install
npm run compile
npm test
```

在 VS Code／Cursor 按 F5（`Run Extension`）開 Extension Development Host；活動列應出現「課堂一鍵安裝」側邊欄（Environment Lane 在上、Course Lane 在下）。

工作區根目錄放置 `classroom-installs.yaml` 後，Course Lane 會列出本課 Install Action；點選會先確認完整 command，再於整合終端機執行。
