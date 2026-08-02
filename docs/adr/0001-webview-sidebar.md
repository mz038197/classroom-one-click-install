# 側邊欄採用單一 Webview View

Tree View 無法承載卡片式版面與品牌強調色，產品又需要在窄側欄清楚呈現環境／本課狀態與主按鈕。我們決定用**單一 Webview View**取代 Tree View：狀態真相仍在 extension host，經 `postMessage` 推畫面；執行前確認維持原生對話框以守信任邊界。第一刀只做功能對齊與版面升級，不加新產品流程。
