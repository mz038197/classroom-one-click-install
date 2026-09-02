# Session Model Allowlist 由同一支模型 GET 帶 key 過濾

老師為單一 Class Session 策展可用模型，不寫進 Course Catalog YAML。學生 BYOK 只寫 router 帶 Classroom API Key 回傳的 VCRouter 子集，並刪掉本機多餘的課堂模型；未設定視同 Template 全集，明確空清單視同零模型。同一支 `GET /extension/chat-language-models`：無 key 回 Template（兌換前預檢、老師候選），有 key 回該寫入的清單。兌換前預檢失敗則不兌換，以免燒掉 Sign-in Handoff；帶 key 的 GET 失敗則留下已兌到的 key，不覆寫本機、不回退成 Template 全集。拉取時機與 Course Catalog 相同。寫入後僅在 VCRouter 模型集合有變時再請 Host Full Restart。Router 必須對該 Session 的 key 拒絕清單外模型；Portal 備援腳本走同一份清單。兩邊 Router 同契約。Cursor 仍不自動寫。

## Considered Options

- **Allowlist 塞進 Course Catalog YAML**：Catalog 邊界是 Install Action 與 Lesson Snippet；否決。
- **另開 session-model-allowlist GET 或塞進兌換回應**：擴充還是要對 Template，啟動／重載仍要獨立 GET；否決。
- **只改 Copilot 清單、router 不拒**：Classroom API Key 仍打得到未勾模型；否決。
- **帶 key 失敗就寫 Template 全集**：空清單或短清單在失敗時會被放大成全部；否決。
