# 04 — Environment Lane：安裝／修復與「請重開終端」

**What to build:** 學生可對未就緒（或已就緒要修復）的 Environment Tool 走確認 → 該 OS 預設安裝流程；完成後側邊欄進入「請重開終端機再重新檢查」，不得直接標成功。重開終端並重新檢查後才變就緒。權限／MDM 失敗時保留錯誤並提示找 IT，不嘗試提權。

**Blocked by:** 03 — Environment Lane：偵測、重新檢查、依依賴禁用本課動作

**Status:** done

- [x] 安裝前確認揭示將執行的安裝內容／風險（含遠端腳本或系統安裝器）
- [x] 安裝流程結束後狀態為請重開終端類提示，而非直接就緒
- [x] 重開終端＋重新檢查成功後顯示版本並就緒
- [x] 就緒後仍提供重新安裝／修復，走同一套確認與重開終端流程
- [x] Win／Mac 預設安裝路徑與規格／工具鏈研究一致（uv standalone、Git installer／Xcode CLT、Node LTS installer）
