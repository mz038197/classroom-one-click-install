# Environment Lane 勾選後一次安裝；拿掉列按鈕

課堂上對 uv、git、Node、PowerShell 7 各點一次安裝、各看一次確認，容易漏裝。Environment Lane 改成勾選 + 區級「安裝」：未安裝與失敗預勾，就緒與請重開終端不預勾（就緒可手動勾當修復）。一次確認，標題固定「安裝所選環境工具」，依固定順序串行，失敗即停。列上不再放「安裝」／「重新安裝／修復」。命令面板也不再當單工具安裝主入口。Course Lane 仍不因缺工具而鎖（[ADR 0010](./0010-course-lane-ungated-by-environment-tools.md)）。裝完仍請重開終端再檢查（[ADR 0011](./0011-environment-probe-version-and-already-installed.md)）。

## Considered Options

- **保留列按鈕，另外加全選安裝**：否決。兩種入口會跟勾選打架，課堂上仍會漏點。
- **命令面板保留單工具安裝當進階入口**：否決。與拿掉列按鈕同一條學生主路徑，側門會把舊習慣帶回來。
- **失敗後繼續裝後面的項**：否決。Windows 可能同時跳出兩個系統安裝器。

## Consequences

- 狀態機只在 Environment Lane 服務：勾選、鈕可否按、單次確認、overlay、進行中鎖定。
- 空選取：安裝鈕禁用，不另提示。
- Windows 無 winget 時同一批可混 shell（uv）與 open-url。
