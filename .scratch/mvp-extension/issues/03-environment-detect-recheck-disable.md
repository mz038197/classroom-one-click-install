# 03 — Environment Lane：偵測、重新檢查、依依賴禁用本課動作

**What to build:** Environment Lane 顯示 uv／git／Node 的就緒版本或「未安裝」。學生按「重新檢查」後，能反映在編輯器外剛裝好的工具（必要時提示重開整合終端）。缺 uv 或 git 時，對應依賴的本課 Install Action 禁用並說明原因；Node 不作為本課清單的鎖定條件。Toolchain Ready 僅作總覽，不鎖死整個 Course Lane。

**Blocked by:** 02 — Course Lane：讀 Catalog → 確認 → 終端機執行 → 狀態

**Status:** done

- [x] 三個 Environment Tool 各自顯示版本或未安裝
- [x] 「重新檢查」會重新探測；外部安裝後在新終端可見時能變就緒
- [x] 缺 uv 時禁用 uv／uvx 類本課動作；缺 git 時禁用含 git+（或明顯需 git）的本課動作
- [x] Node 未就緒不導致整區 Course Lane 被鎖
- [x] 無「學生自訂環境安裝命令」入口
