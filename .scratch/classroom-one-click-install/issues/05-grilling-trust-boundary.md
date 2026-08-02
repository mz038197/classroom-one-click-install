# Grilling: 擴充功能允許執行哪些命令

Type: grilling
Status: resolved

## Question

學生點擊時，擴充功能的信任邊界在哪：是否**只**能執行 Course Catalog 與 Environment Lane 預先定義的動作、要不要拒絕 catalog 內的任意 shell、git URL 是否要允許清單、以及惡意或誤植 catalog 時規格如何要求防護與提示？

## Answer

### 可執行來源（僅此兩類）

1. **Environment Lane**：固定的 uv／git／Node 偵測與官方預設安裝流程（見環境行為／工具鏈研究票）；學生不可自訂安裝命令。
2. **Course Lane**：僅執行工作區 `classroom-installs.yaml` 內各筆的 `command`。

- **不提供**學生自訂命令輸入框（要跑別的請用整合終端機）。
- MVP **不做** `command` 前綴白名單、也**不做** git host 允許清單——信任「教材工作區裡的 catalog」＋人工確認。

### Course Lane 確認

- 每次點擊都先跳出確認，**完整顯示**即將執行的 `command`（及 title）。
- 學生取消則不執行；確認後才送進整合終端機。

### 誤植／惡意 catalog

- 防護主力是：來源限工作區檔案＋每次確認顯示全文。
- 規格應註明：打開不可信工作區時，點本課動作等同同意執行該 YAML 內命令；老師應只把可信 catalog 放進教材 repo。
- 執行失敗以終端機輸出＋側邊欄失敗狀態呈現；不嘗試「消毒後改寫命令」。
