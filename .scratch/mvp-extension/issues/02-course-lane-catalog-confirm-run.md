# 02 — Course Lane：讀 Catalog → 確認 → 終端機執行 → 狀態

**What to build:** 工作區根目錄若有 Course Catalog，側邊欄 Course Lane 列出各 Install Action 的 title（與選填 description）。學生點一筆後先看到完整 command 確認框；取消不執行，確認後在工作區根目錄於整合終端機執行該命令，側邊欄更新進行中／成功／失敗，並可再執行或重試。

**Blocked by:** 01 — 擴充功能骨架與側邊欄殼

**Status:** done

- [x] 合法 `classroom-installs.yaml` 出現在工作區根目錄時，Course Lane 顯示對應 Install Action
- [x] 點擊後確認框顯示完整 command；取消則終端機不執行該動作
- [x] 確認後命令在工作區根目錄執行，側邊欄反映進行中／成功／失敗
- [x] 成功可再執行、失敗可重試；狀態可依 Install Action 的 id 區分
- [x] 優先以可取得 exit code 的終端機整合路徑更新成敗（規格之 Shell Integration 主路徑）
