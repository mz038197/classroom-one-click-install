# 06 — Webview 側邊欄 UI

**What to build:** 以單一 Webview View 取代 Tree View，功能對齊現況並升級版面（主題底＋凡思綠強調）；確認框維持原生。

**Blocked by:** 05 — 課堂 VSIX 與教材樣本

**Status:** done

- [x] `package.json` view `type: webview`；註冊 `WebviewViewProvider`
- [x] 畫面模型由 extension host 組裝並 `postMessage`
- [x] Environment 在上、Course 在下；主按鈕／狀態／空狀態
- [x] 確認框仍走原生（本課／環境安裝）
- [x] ADR：`docs/adr/0001-webview-sidebar.md`
