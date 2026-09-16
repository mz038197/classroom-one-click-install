## Problem Statement

學生在 Environment Lane 要裝齊環境時，必須對 uv、git、Node 各點一次「安裝」、各看一次確認框。課堂上容易漏裝、連點三次。PowerShell 7（`pwsh`）也不在清單裡，徽章「就緒」與桌面安裝腳本不一致。學生要的是：勾選要裝的 Environment Tool，按一顆安裝，一次看完會跑什麼，把勾選的裝完（失敗就停）。不要 VS Code。不要列上各一顆安裝鈕。

## Solution

Environment Lane 改為勾選 + 一顆「安裝」。未安裝與上次安裝失敗預勾；已就緒與「請重開終端」不預勾（就緒可手動勾＝這趟修復）。空選取時按鈕禁用、不提示。一個確認框標題「安裝所選環境工具」，列齊這次的命令或網址。依固定順序串行執行；失敗即停；只有正在跑的列顯示「安裝中」；進行中鎖定勾選與按鈕。裝完仍請重開終端再「重新檢查」，不直接標就緒。

Environment Tool 固定四個、順序 uv → git → Node.js → PowerShell 7。Toolchain Ready 要四個都探測到可解析版本（PowerShell 7 只認 `pwsh`，不認 Windows PowerShell 5.1）。Windows 有 winget 時 Git、Node、PowerShell 7 用同一組 winget 旗標；uv 仍走 Astral 官方腳本。沒有 winget 時那三項開官方頁，可與 uv 同一批。macOS 上 PowerShell 7 開啟 Microsoft Learn〈Install PowerShell on macOS〉，不 brew、擴充不 sudo。Course Lane 仍不因缺工具而鎖。

## User Stories

1. As a 學生, I want 一次勾選多個未安裝的 Environment Tool 再按安裝, so that 我不必連點三次、漏裝其中一個。
2. As a 學生, I want 打開側邊欄時未安裝的項目已經勾好, so that 新電腦預設就是「把還沒有的裝起來」。
3. As a 學生, I want 已就緒的項目預設不要勾, so that 我不會誤觸重新安裝正在用的 uv。
4. As a 學生, I want 手動勾已就緒的項目再安裝, so that 損壞時仍能走同一套官方安裝當修復。
5. As a 學生, I want 「請重開終端」的項目不要預勾, so that 我被引導去重開終端，而不是再跑一次安裝器。
6. As a 學生, I want 「請重開終端」的項目仍可手動勾, so that 我堅持再裝一次時不必等重新檢查。
7. As a 學生, I want 安裝失敗的項目預勾, so that 下一趟會重試失敗項並繼續還沒跑到的項。
8. As a 學生, I want 沒有勾任何項時安裝鈕不能按且沒有錯誤提示, so that 空按不會跳出多餘訊息、也不會以為壞了卻毫無回饋以外的誤解（鈕是灰的）。
9. As a 學生, I want 每一列不要再有「安裝」或「重新安裝／修復」按鈕, so that 只剩一種安裝入口、不會跟勾選打架。
10. As a 學生, I want 按安裝後只看到一個確認框, so that 我不用連點三個「執行」。
11. As a 學生, I want 確認框標題是「安裝所選環境工具」, so that 標題不會因混了修復而換成另一句。
12. As a 學生, I want 確認框列出這次每一項將執行的完整命令或將開啟的網址, so that 我知道遠端腳本、winget 或官網風險。
13. As a 學生, I want 確認框對 uv 仍可看到先檢視腳本的替代命令（若該項有）, so that 信任邊界與現在單項安裝相同。
14. As a 學生, I want 若這批含已就緒項，該列在確認框裡標明是重新安裝／修復, so that 我知道會再跑安裝器。
15. As a 學生, I want 取消確認後不要開始安裝且勾選維持原樣, so that 我可以改勾再按。
16. As a 學生, I want 安裝依 uv、git、Node.js、PowerShell 7 的固定順序跑, so that 本課用的工具先裝，PS7 的 UAC／網頁不擋住 uv。
17. As a 學生, I want 某一項失敗時後面的不要開始, so that 不會同時跳出兩個系統安裝器。
18. As a 學生, I want 失敗那項看到找 IT、本擴充不提權的說明, so that 我知道要找老師或管理員。
19. As a 學生, I want 這批已經跑完且官方安裝器成功（含明確 already installed）的項變成「請重開終端」, so that 狀態不會假就緒。
20. As a 學生, I want 還沒輪到的項維持原狀態（通常仍是未安裝且維持勾選）, so that 我下一趟還會裝到它們。
21. As a 學生, I want 只有正在執行的那一列顯示「安裝中」, so that 我不會以為 Node 已經在裝。
22. As a 學生, I want 批次進行中不能改勾選、不能再按安裝, so that 不會排出第二批或改到還沒跑的隊列。
23. As a 學生, I want 批次結束（成功停或失敗停）後勾選與按鈕解鎖, so that 我可以重試。
24. As a 學生, I want 重開整合終端後按「重新檢查」才讓探測成功的項變就緒並顯示版本, so that 與現在探測契約一致。
25. As a 學生, I want 側邊欄看到第四個 Environment Tool「PowerShell 7」, so that 與課堂要求的 `pwsh` 對得上。
26. As a 學生, I want 已安裝 Windows PowerShell 5.1 但沒有 `pwsh` 時 PowerShell 7 顯示未安裝, so that 我不會以為內建 PowerShell 就算數。
27. As a 學生, I want `pwsh --version`（或同等探測命令）stdout 有可解析版本行時該項就緒, so that 結束碼非 0 仍可就緒，與 uv／git／Node 相同。
28. As a 學生, I want 四個都就緒時才看到 Toolchain Ready 徽章, so that 徽章代表清單上每一個 Environment Tool 都探測到了。
29. As a 學生, I want 缺 PowerShell 7 時仍能點本課 Install Action, so that 環境區不是本課關卡。
30. As a 學生 on Windows with winget, I want Git／Node／PowerShell 7 都以同一組安靜旗標呼叫 winget, so that 盡量不要卡在套件精靈（UAC 該出仍會出）。
31. As a 學生 on Windows without winget, I want 勾選的 Git／Node／PowerShell 7 改開官方頁，uv 仍跑官方腳本, so that 沒有套件管理員也能開始裝。
32. As a 學生, I want 確認框把「將執行」和「將開啟」分開寫, so that 我知道有的步驟只是開瀏覽器。
33. As a 學生, I want 開啟下載頁成功不要被當成該工具已就緒, so that 我仍會重開終端並再檢查。
34. As a 學生 on macOS, I want PowerShell 7 的安裝打開 Microsoft Learn〈Install PowerShell on macOS〉, so that 我能依說明選 arm64 或 x64 的 .pkg。
35. As a 學生 on macOS, I want 確認框寫明選對晶片、系統安裝器可能要管理員密碼、開頁≠已就緒, so that 我不會以為擴充已經靜默裝好 `pwsh`。
36. As a 學生 on macOS, I want uv／git／Node 的安裝路徑不要因本票而改成 Homebrew 或官網 .pkg, so that 既有 Mac 契約仍在。
37. As a 學生, I want uv 在 Windows 仍走 Astral 官方 PowerShell 安裝腳本、不走 winget, so that 沒有 winget 也能裝 uv。
38. As a 老師, I want 擴充不要提供 VS Code 當 Environment Tool, so that 編輯器安裝留在桌面腳本，不跟本課工具鏈混在一區。
39. As a 學生, I want 命令面板不要再當「單列安裝」的主入口, so that 跟側邊欄拿掉列按鈕一致。
40. As a Pegasi 發行的學生, I want 同一套勾選與四個工具行為, so that 品牌差異不含 Environment Lane。
41. As a Cursor 學生, I want 探測與安裝仍以 VS Code 整合終端契約為準、不另做 Cursor 探測, so that 不違反既有 ADR。
42. As a 學生, I want 官方安裝器明確 already installed 時這項視為本次成功並請重開終端, so that 不把泛用結束碼 1 當已安裝。
43. As a 實作 agent, I want glossary 把 Environment Tool 寫成四個、Toolchain Ready 寫成四者皆探測成功、Environment Lane 寫成勾選後一次安裝且 Mac PS7 為開 Learn 頁, so that 之後的票不再寫「永遠三個」或「每列一顆安裝」。

## Implementation Decisions

- 測試與行為的主縫是 **Environment Lane 服務**：負責列順序、勾選預設與切換、安裝鈕可否按、單次確認、依序執行、失敗即停、overlay（安裝中／請重開終端／失敗）、進行中鎖定。不要為 Webview 另做一套狀態機。
- 單項 `installTool(一個 id)` 不再是學生主路徑；改為「安裝目前勾選集合」。確認依賴仍是一次 `confirm(title, detail)`；execute 仍一次一筆既有安裝計畫。
- 安裝計畫解析器繼續決定每個 Environment Tool 在 win32／darwin 上是 shell 還是 open-url。新增 PowerShell 7。Windows 有 winget 時 Git、Node、PowerShell 7 的命令形狀為：`winget install --id <id> -e --source winget --disable-interactivity -h --accept-package-agreements --accept-source-agreements`（id 分別為 Git.Git、OpenJS.NodeJS.LTS、Microsoft.PowerShell）。uv 維持 Astral 官方腳本。沒有 winget 時 Git／Node／PS7 為 open-url（PS7 用 Microsoft Learn macOS 頁僅在 darwin；Windows 無 winget 開 Microsoft 的 Windows 安裝說明／下載頁，與 git／Node 官網頁同類）。
- darwin 上 PowerShell 7 的計畫 kind 為 open-url，URL 為 Microsoft Learn「Install PowerShell on macOS」（英文文件路徑即可，不本地化硬編碼多語系 URL）。不跑 brew、不在終端組 `sudo tar`。
- 探測：Environment Tool id 集合改為 uv、git、node、以及 PowerShell 7（實作識別名與 `pwsh` 命令對應）。版本解析認 `pwsh` 輸出中可解析的版本行。Unix 探測前綴與 uv／git 相同（使用者 bin）；**不要**把 nvm 接到 pwsh 探測。
- Toolchain Ready 布林值 = 四個工具的探測狀態皆為就緒。
- 確認框組裝：標題固定「安裝所選環境工具」；內文依勾選且此次會跑的計畫列出 summary + 將執行／將開啟；uv 的 preview 命令若有則附上；混和批次時 shell 與 open-url 分段。
- 側邊欄：每列 checkbox + 狀態文案；區級「安裝」與既有「重新檢查」。拿掉列級安裝／修復按鈕。Webview 訊息改為切換勾選與「安裝所選」，不再對單一 toolId 發學生主路徑安裝。
- 命令面板若仍暴露單工具安裝，應移除或改為不與學生主路徑重複的隱藏命令，避免列按鈕從側門回來。
- 更新領域文件：Environment Tool 清單與 Avoid；Environment Lane 改為勾選一次安裝，並寫 Mac PS7 開 Learn、以及 Windows 三條 winget 旗標；Toolchain Ready 改為四者。另寫 ADR：為何 Ready 含 `pwsh`、為何 Mac 開頁而不是 brew／sudo、為何三條 winget 都加 silent 旗標、為何拿掉列按鈕。
- 不提權、不繞過 MDM；open-url 打不開視為該項失敗並停止批次。
- 凡思與 Pegasi 同一套 Environment Lane；不為 Cursor 另做探測。

## Testing Decisions

只測對外行為：給定探測結果與（可選）確認／執行假依賴，看 Lane 的 view（勾選、鈕是否禁用、狀態字、Toolchain Ready）以及 confirm／execute 被呼叫的次數、順序、計畫內容。不測 Webview DOM、不測 VS Code API 細節。

主測 Environment Lane 服務（既有 install flow／lane view 測試是 prior art）。安裝計畫解析器補 PowerShell 7 與三條 winget 字串、Mac Learn URL、無 winget 的 open-url。探測解析與探測命令組補 `pwsh`，並斷言 5.1 的 powershell 輸出不能讓 PowerShell 7 就緒。確認框組裝補「一批多計畫、標題固定、混合 shell／url」。

不新增第二套狀態機測試。側邊欄訊息形狀有既有 provider 測試則改契約；沒有則以 Lane view 為準即可。

建議案例（皆走 Lane 服務）：四個皆 missing 時預勾四個且鈕可按；四個皆 ready 時皆不勾且鈕禁用；失敗 overlay 預勾、needs-reopen-terminal 不預勾；確認取消則 execute 次數 0；execute 在第二項失敗則第三項不會 execute；成功項為 needs-reopen-terminal 且不得為 ready；進行中忽略再一次安裝；Windows winget 計畫含決定的旗標；darwin pwsh 為 Learn URL；probe 只認 pwsh。

## Out of Scope

- VS Code／Cursor 當 Environment Tool 或本 Lane 安裝
- 桌面 `.bat`／選單 ps1、單檔 exe、IExpress
- Homebrew、Mac `sudo tar` 安裝 PS7
- 把 uv 改成 winget
- Linux 保證
- 依 Course Catalog 動態決定 Ready 子集
- 新領域種類（非 Environment Tool 的「可選工具」）
- 改變 Course Lane 與環境工具的並行契約（ADR 0010）
- 改變「裝完不直接就緒」與 already-installed 契約（ADR 0011）
- 改變探測以 VS Code 整合終端為準（ADR 0005／0008）
- nvm 接到 pwsh 探測
- 批次完成後自動重開終端或自動重新檢查
- `npx skills` 風格 logo／空白鍵 TUI（這是側邊欄 checkbox）
- Nickname Redeem、BYOK、Snippet Lane、Workspace MCP Config

## Further Notes

Grill 結論分兩段疊加：先是勾選批次與拿掉列按鈕；後是第四個 Environment Tool 為 PowerShell 7 且 Ready 要四個都好。第一次摘要裡「不要 PS7」已被第二次撤回。

Windows 無 winget 時 PowerShell 7 的官方頁應與 Learn 的 Windows 安裝說明或 GitHub 發行頁同等「官方」，實作選與 git／Node 相同風格的單一穩定 URL，確認框寫將開啟該 URL。

macOS Learn 頁：https://learn.microsoft.com/powershell/scripting/install/install-powershell-on-macos （允許地區碼前綴，目標是該文件而非 releases 檔案列表）。
