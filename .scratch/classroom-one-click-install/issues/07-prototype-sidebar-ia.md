# Prototype: 側邊欄資訊架構草圖

Type: prototype
Status: resolved
Blocked by: 03, 04

## Question

做一份低保真側邊欄草圖（可為 Markdown wireframe 或粗糙 UI），讓人能反應 Environment Lane 與 Course Lane 的資訊架構：工具就緒狀態、本課 Install Action 列表、點擊中／成功／失敗怎麼呈現。目標是鎖定「看起來／操作起來像什麼」，不是做完可上架的擴充功能。

## Answer

採用**變體 A：環境工具在上、本課安裝在下**（非變體 B 的本課優先／環境摺疊）。

鎖定的 IA 要點：

- 頂部顯示工作區名稱
- Environment Lane：每工具顯示就緒＋版本或未安裝；`重新檢查`；就緒仍有`重新安裝／修復`；安裝後狀態為「請重開終端機再重新檢查」；缺工具時軟提示（不鎖死整個 Course Lane）
- Course Lane：列出 `title`／選填 `description`；狀態含成功／進行中／失敗／因缺 uv 或 git 而禁用；執行前確認框顯示完整 `command`
- 失敗提示短文＋指向終端機（與 git 認證票一致）

草圖資產（含確認／進行中／失敗示意）：[prototypes/07-sidebar-ia.md](../prototypes/07-sidebar-ia.md)
