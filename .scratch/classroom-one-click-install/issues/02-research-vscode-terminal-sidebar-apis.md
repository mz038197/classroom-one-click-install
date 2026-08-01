# Research: VS Code 擴充功能終端機執行與側邊欄狀態 API

Type: research
Status: resolved

## Question

VS Code Extension API（Cursor 相容前提也可註明）如何支援：從擴充功能**在整合終端機執行一條 shell 命令**、以及用 **Sidebar／Webview** 顯示「進行中／成功／失敗」並在命令結束後更新狀態？請指出關鍵 API、限制（例如無法靜默取得 exit code 時的作法）、以及規格撰寫時應假設的能力邊界。

## Answer

採 Shell Integration 主路徑：`TerminalShellIntegration.executeCommand` 加上以 execution 身分過濾的 `onDidEndTerminalShellExecution`，即可用 exit code 更新側邊欄為成功／失敗／未知。`sendText` fallback 只能確認已送出，不能取得命令結束或 exit code；若規格要求跨 shell 的可靠可判定結果，改用受控的 VS Code Task。Tree View 足以呈現簡單狀態；需進度與錯誤詳情時用 Webview View，並讓 extension host 保有狀態真相。Cursor 相容性沒有可由 VS Code 文件導出的保證，應列入實測矩陣。

完整研究與官方來源：[02-vscode-terminal-sidebar-apis.md](../research/02-vscode-terminal-sidebar-apis.md)。
