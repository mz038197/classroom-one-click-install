# VS Code 擴充功能：終端機命令與側邊欄狀態 API 研究

## 決策結論

產品應把「在使用者可見的整合終端機執行命令、並可靠回報成功／失敗」設計為 **Shell Integration 可用時的主要路徑**：建立專用 terminal，等候 `onDidChangeTerminalShellIntegration`，用 `TerminalShellIntegration.executeCommand(...)` 執行，並只處理與本次回傳 `TerminalShellExecution` 相同的 `onDidEndTerminalShellExecution` 事件。事件的 `exitCode === 0` 為成功、非零為失敗、`undefined` 應顯示「結果未知／視為失敗」；官方型別文件明確列出 `undefined` 的原因，例如 shell 未回報、開啟子 shell、Ctrl+C 或空白 Enter。  
來源：[TerminalShellIntegration / 執行範例](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L7816-L7926)、[TerminalShellExecutionEndEvent](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L8078-L8129)。

若 Shell Integration 沒有啟用，仍可用 `Terminal.sendText(command, true)` 將文字寫入 shell stdin 並送出 Enter，但 API **不能得知該命令何時結束或其 exit code**；不要用 `onDidCloseTerminal` 當命令完成訊號，因為 `Terminal.exitStatus` 只有整個 terminal process 結束後才有值。此 fallback 的產品狀態最多是「已送出／等待使用者查看終端機」，不能宣稱成功或失敗。  
來源：[Terminal.sendText 與 shell integration 可缺席條件](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L7697-L7716)、[官方 fallback 範例與限制](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L7832-L7868)、[Terminal.exitStatus](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L7676-L7689)。

若產品需求是「在所有支援環境都必須取得可判定的結果」，應改以 VS Code `Task`（`new Task(..., new ShellExecution(...))`）作為受控執行模型，透過 `tasks.executeTask` 與 `tasks.onDidEndTaskProcess` 關聯 `TaskExecution`，讀取 `TaskProcessEndEvent.exitCode`。被終止的 task 仍可能給 `undefined`，因此同樣必須表達取消／未知；而無法啟動新 process 的環境中，Shell/Process task 也會拋出例外。Task 的呈現可配置為終端機面板。  
來源：[ShellExecution](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L9022-L9045)、[tasks.executeTask 與限制](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L9331-L9395)、[TaskProcessEndEvent.exitCode](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L9298-L9312)、[TaskPresentationOptions](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L8732-L8763)。

## 建議實作輪廓

1. 以 `vscode.window.createTerminal({ name, cwd })` 建立或重用「Classroom install」專用 terminal，呼叫 `show(true)` 讓使用者可查看命令輸出但不強制搶焦點。`createTerminal` 在無法建立新 process 的環境會拋出例外，須轉為 failure UI。  
   來源：[createTerminal](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L11645-L11667)、[Terminal.show](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L7718-L7728)。
2. 先將側欄狀態設為 `running`；若 shell integration 已存在立即執行，否則訂閱 `onDidChangeTerminalShellIntegration`，並設一個短暫等待上限。官方文件指出新 terminal 剛建立時一定是 `undefined`，且 Cmd、或使用者 shell 設定衝突時可能永遠不會啟用。  
   來源：[Terminal.shellIntegration 的生命週期與相容性](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L7697-L7706)、[shell-integration 事件](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L11180-L11196)。
3. 主路徑呼叫 `executeCommand(commandLine)`（或 command + args overload）；將本次 execution 的物件身分保存，接收結束事件時以 `event.execution === execution` 過濾其他使用者或擴充功能命令，再依 exit code 更新 `succeeded`、`failed` 或 `unknown/cancelled`。`executeCommand` 可能在不支援 API 的 terminal（例如 task terminal）拋出；傳入不可信字串也不是安全邊界，因為 shell substitution 等字元仍可能執行程式碼。  
   來源：[executeCommand 限制與輸入安全警告](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L7824-L7886)、[結束事件與 exit-code 判讀](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L8097-L8129)。
4. fallback 使用 `sendText` 時顯示 `submitted-unverified`，提供「開啟終端機」與「重試」動作；不要猜測完成時間、解析一般 terminal 畫面，或把 terminal 被關閉誤報為本命令失敗。  
   來源：[Terminal.sendText](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L7708-L7716)、[Terminal.exitStatus 的 terminal-level 語意](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L7676-L7689)。

## Sidebar / Webview 狀態 UI

### 最小 UI：Tree View

在 `package.json` 以 `viewsContainers.activitybar` 與 `views` 貢獻自訂 sidebar container/view；擴充功能以 `registerTreeDataProvider` 或 `createTreeView` 提供 `TreeDataProvider`。每次狀態切換時 fire provider 的 `onDidChangeTreeData`，即可重繪 running / success / failure 的 `TreeItem` label、description、icon 與 command。這是僅需少量文字與動作的首選。  
來源：[Tree View guide：註冊與更新資料](https://code.visualstudio.com/api/extension-guides/tree-view)、[TreeDataProvider.onDidChangeTreeData](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L12218-L12226)、[createTreeView / registerTreeDataProvider](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L11669-L11687)。

### 富 UI：Webview View

若需進度列、安裝步驟、展開錯誤與「重試」按鈕，將 view 貢獻在 sidebar，並以 `window.registerWebviewViewProvider(viewId, provider)` 提供 `WebviewView`。Extension host 將狀態 JSON 以 `webview.postMessage` 推給畫面；網頁端以 `acquireVsCodeApi().postMessage` 回傳按鈕事件，extension 端訂閱 `webview.onDidReceiveMessage`。webview 與 extension process 是隔離的，因此 webview 不能直接取得 Terminal 或執行命令。  
來源：[Webview views 可在 sidebar/panel 顯示](https://code.visualstudio.com/api/extension-guides/webview)、[registerWebviewViewProvider](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L11727-L11745)、[Webview message passing 與隔離](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L9943-L9977)。

狀態的唯一真相應留在 extension host；view resolve / visible 時再推送完整目前狀態。`postMessage` 僅對 live webview 可傳遞，回傳 `true` 也不保證前端 listener 已收到；隱藏 view 預設會重建內容。應以 webview 的 `getState/setState` 或 extension host 狀態恢復，而非為狀態同步一律打開 `retainContextWhenHidden`，因為該選項有高記憶體成本。  
來源：[Webview.postMessage 交付限制](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L9980-L10010)、[Webview state 與 retainContextWhenHidden 建議](https://code.visualstudio.com/api/extension-guides/webview#persistence)。

Webview HTML 需要 CSP、nonce 與輸入消毒；它可執行 script 和載入內容，故官方要求遵循一般 web security best practices。  
來源：[Webview 安全注意事項](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L9960-L9966)。

## 規格應明訂的能力邊界

- **不是背景 shell API。** `Terminal.sendText` 是把文字寫到使用者 terminal shell 的 stdin；命令行經過使用者選擇的 shell、profile、工作目錄與互動狀態。產品不得把它當成可攜、無 UI 或安全隔離的 process runner。  
  來源：[Terminal.sendText 的 stdin 語意](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L7708-L7716)、[shell command input 安全警告](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L7879-L7886)。
- **可靠完成回報以 Shell Integration 為條件。** 規格應允許 `unknown` 終態與 fallback；不得要求 `sendText` universal success/failure callback。  
  來源：[官方 fallback 說明](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L7845-L7851)、[exitCode 可為 undefined](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L8097-L8110)。
- **命令輸入是安全邊界。** 不可將 workspace、webview、設定或遠端資料直接字串插進 command line；白名單可執行檔與受控 arguments，並要求使用者確認有副作用的命令。`executeCommand(command,args)` 的 quoting 也明確不是安全機制。  
  來源：[executeCommand argument escaping 非安全機制](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L7873-L7886)。
- **取消與並行需產品狀態機。** 追蹤每次 execution/task 的身分，避免另一個命令結束覆寫目前狀態；將取消、terminated、exit code unknown 與 non-zero failure 分開顯示。  
  來源：[TerminalShellExecutionEndEvent](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L8078-L8129)、[TaskProcessEndEvent](https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts#L9298-L9312)。
- **Cursor 相容性：**本研究的主來源只定義 VS Code API，未提供 Cursor 對上述 terminal、task 或 webview API 的相容性承諾。因此規格可標示「以 VS Code API 為實作目標」，但 Cursor 必須列為支援矩陣中的實機驗證目標；不可由 VS Code 文件推論 Cursor 一定支援 Shell Integration 或相同事件行為。  
  來源：[VS Code Extension API 定義](https://code.visualstudio.com/api/references/vscode-api)。

## 建議驗收情境

1. 支援 shell integration：成功（0）、失敗（非 0）、Ctrl+C（unknown/cancelled）各能正確更新 sidebar。
2. 不支援 shell integration（例如 Cmd）：命令仍送至可見 terminal，sidebar 顯示「已送出，無法驗證」，不誤報成功。
3. Webview 隱藏再開、extension reload 後：顯示由 extension host 恢復的最後狀態。
4. 兩次連按安裝：舊 execution 的結束事件不覆寫新 execution 狀態。
5. 在 VS Code 與指定 Cursor 版本各執行上述案例，將實測結果記入相容性矩陣。
