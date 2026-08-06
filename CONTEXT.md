# Classroom One-Click Install

課堂用編輯器擴充功能：學生點選項目以完成環境工具或本課安裝動作，並可在擴充內完成 router 邀請兌換與 BYOK 設定。此檔只記領域用語。

## Language

**Install Action**:
老師策展、學生可點的一筆安裝動作；含顯示名稱、必填的 Action Kind，以及背後要執行的指令意圖（例如 `uv add` 或 `uvx`），不必然等於 PyPI 套件短名。
_Avoid_: 模組（單獨使用時易與 Python module 混淆）, package name（暗示只是短名）

**Action Kind**:
標在單一 Install Action 上的封閉種類；YAML 欄位 `kind`，值為 `skill`／`package`／`mcp`，學生分別看到 tag「Skill」「套件」「MCP」。純顯示標示：不分區、不收合、不改變啟用／執行／依賴行為。缺漏或非法值則整份 Course Catalog 載入失敗。
_Avoid_: Action Group, 巢狀 groups, 依種類自動分區收合, 模組（單獨當領域詞或第四種 kind）, 開放任意字串 kind, 用 kind 驅動安裝邏輯

**Environment Tool**:
機器層級、固定清單的工具鏈成員（目前：uv、git、Node.js）；用來讓本課安裝動作跑得起來。
_Avoid_: 全域模組, 系統套件（太寬）

**Course Catalog**:
放在學生工作區根目錄的策展清單檔 `classroom-installs.yaml`，以頂層 `actions` 列出本課的 Install Action。
_Avoid_: 巢狀 `groups`（已撤回）, 遙控清單（MVP 不做）, 應用內建唯一清單, 多份清單（MVP 不做）

**Router Lane**:
側邊欄最上方區塊（學生可見標題「課堂連線」）：學生須先輸入 Invite Code 才能「連線登入」；主路徑為填碼 → Google → 深連結回來後自動兌換並 BYOK Setup。進入「等待登入」（或連線失敗）後才露出一次性貼碼與「貼上並完成連線」，供深連結未跳回時使用；可「重新連線登入」清掉舊手遞重跑。等待期間邀請碼仍可改。可整區收合／展開。Portal 網頁兌換與下載 install 腳本僅為備援。
_Avoid_: 塞進 Environment Lane, Course Lane, 僅命令面板而無側邊欄入口, 與 Portal 並列為同等主路徑, 無碼仍開 Google, idle 就顯示貼碼／完成鈕

**Environment Lane**:
側邊欄中負責檢查／安裝 Environment Tool 的區塊；學生可整區收合／展開（在 Router Lane 之下，與 Course Lane 並列）。

**Course Lane**:
側邊欄中列出 Course Catalog 並觸發 Install Action 的扁平清單區塊；學生可整區收合／展開。不分依 Action Kind 的子區。

**Toolchain Ready**:
uv、git、Node.js 三者皆透過終端機偵測為可用（找得到指令且版本命令成功）的總覽狀態；與是否由本擴充功能安裝無關。不是 Course Lane 的總開關——本課動作改依各動作所需工具是否就緒來啟用。
_Avoid_: 環境安裝完成（未說明偵測基準）, 本擴充功能已執行安裝（不足以代表就緒）, 三工具未齊就不能裝任何本課項目

**Marketplace Install**:
VS Code 學生從 Visual Studio Marketplace 安裝本擴充功能的主路徑。
_Avoid_: 市集側載, Open VSX 安裝（本產品不上架 Open VSX）

**Sideload**:
以 `.vsix` 檔直接安裝擴充功能的備援路徑；用於 Cursor、離線、市集異常，或需固定某一版本時。
_Avoid_: 從市集安裝, 本機開發 Host（F5）當課堂安裝

**Invite Code**:
老師為某一課堂發出、給學生兌換用的短碼；學生只在擴充內輸入，不經深連結或開啟登入的 URL 傳遞。空白時不可開始「連線登入」；有碼且 Sign-in Handoff 到達時自動兌換。擴充內輸入不改變既有兌換威脅模型（仍須 Google 身分＋有效碼）；不在此產品範圍內單獨加硬 router（如 rate limit）。
_Avoid_: API key, session token, 邀請連結（若指整段 URL）, 把擴充輸入框本身當成新的匿名兌換破口

**Classroom API Key**:
兌換 Invite Code 後取得的 `vcr_sk_…` 憑證；編輯器以此呼叫 router 的 OpenAI-compatible API。擴充在兌換成功後保存它（Host secret、固定 hex id、覆寫同一格）；換新邀請碼時再跑一次流程並覆寫。本機不會隨課堂結束自動刪除。
_Avoid_: Portal session, Google token, upstream provider key

**Clear Classroom Connection**:
學生主動清除本機課堂連線：刪 Host／擴充內的 Classroom API Key、移除 VCRouter provider，並將 Router Lane 重置為未兌換；不動其他 provider（如 OpenRouter）。
_Avoid_: 只清側邊欄狀態卻留 key, 清掉學生其他 BYOK, 每次兌換換新 secret id 造成堆積

**Sign-in Handoff**:
瀏覽器完成 Google 登入後交給擴充的短效、單次證明，僅供立刻兌換 Invite Code；不是長期 Portal session，兌換後即丟棄。主路徑經 `vscode://` 深連結；深連結失敗時以瀏覽器顯示的一次性貼碼交回擴充。URI／貼碼皆不得承載 Classroom API Key。
_Avoid_: session credential（常駐）, API key in URI, oauth_state cookie, 失敗就只能改走 Portal

**BYOK Setup**:
把 router 的模型清單與 Classroom API Key 寫入**目前正在執行本擴充的**那個編輯器之語言模型／自訂端點設定，使 Copilot（或同等客戶端）能走課堂 router。`chatLanguageModels.json` 的 `apiKey` 必須是 Host 的 secret 參照（如 `${input:chat.lm.secret.…}`）；Classroom API Key 本體進 Host secret storage，不把 `vcr_sk_…` 明文當 `apiKey` 字串。僅支援 VS Code；Cursor 不自動寫入，改提示 Portal／手動。不一次改寫其他編輯器產品的設定路徑。模型清單向 router 拉取（單一真相在 router），不打包死在擴充裡。
_Avoid_: 下載並執行 install-vscode-models.cmd（那是 Portal 備援路徑）, 只合併模型卻不處理 key, 明文 Classroom API Key 寫進 `apiKey`, 一次寫入多個編輯器產品路徑, 以擴充內建 template 為唯一來源, 在 Cursor 自動寫 Host secret
