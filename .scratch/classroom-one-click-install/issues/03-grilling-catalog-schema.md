# Grilling: Course Catalog 設定檔要長什麼樣

Type: grilling
Status: resolved

## Question

工作區內的 Course Catalog 檔應採用什麼格式與欄位，才夠表達課堂真實安裝動作（例如 `uv add --upgrade "pkg @ git+https://…"`、`uvx --from git+https://… entry --update`），又夠簡單讓老師維護？須決定：檔名、結構（JSON／YAML／TOML 等）、一筆 Install Action 的必填／選填欄位、以及顯示名稱與實際命令之間的對應方式。

## Answer

### 決議

- **檔案**：工作區根目錄 `classroom-installs.yaml`（YAML；MVP 不支援多份清單／自訂路徑）
- **表達方式**：每一筆以**整段 `command` 字串**為準；側邊欄顯示 `title`（與選填 `description`）
- **執行目錄**：一律工作區根目錄（不設每筆 `cwd`）
- **頂層結構**：`actions` 陣列
- **每筆必填**：`id`、`title`、`command`
- **每筆選填**：`description`
- **`id`**：穩定識別用（狀態記憶）；學生未必看到

### 範例（對應課堂真實指令）

```yaml
actions:
  - id: peas-agent-tools
    title: 安裝 peas-agent-tools
    description: 從 GitHub 加入專案依賴（可升級）
    command: >-
      uv add --upgrade "peas-agent-tools @ git+https://github.com/mz038197/peas-agent-tools.git"

  - id: peas-agent-runtime
    title: 安裝 peas-agent-runtime
    command: >-
      uv add git+https://github.com/mz038197/peas-agent-runtime.git

  - id: dataset-streamlit-shell
    title: 安裝 dataset-streamlit-shell
    description: 以 uvx 從 Git 套件執行安裝入口
    command: >-
      uvx --from git+https://github.com/mz038197/dataset-streamlit-shell-installer.git add-dataset-streamlit-shell --update
```

命令信任邊界（能否拒絕危險字串等）不在本票，見信任邊界票。
