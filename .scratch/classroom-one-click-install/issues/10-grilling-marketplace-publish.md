# Grilling: 上架 VSIX 到市集

Type: grilling
Status: resolved
Blocked by: 09

## Question

要把擴充功能上架到哪個市集、與側載如何並存、身分／授權／發版流程與完成定義為何？

## Answer

1. **只上 Visual Studio Marketplace**（不上 Open VSX）。
2. **Marketplace Install 為主、Sideload 為備援**（Cursor／離線／市集異常／釘版急救）。
3. 身分鎖定 `vans-coding.vans-classroom-install`。
4. **MIT**；掛公開 repo `https://github.com/mz038197/classroom-one-click-install.git`。
5. Publisher `vans-coding` 由維護者個人 Microsoft 帳號擁有並操作。
6. 首發版本 **`0.1.0`**。
7. 接受市集自動更新；不另做預設釘版流程。
8. 市集／`EXTENSION_README`：**僅繁中、只寫 VS Code**（不提 Cursor）。
9. Cursor：僅 repo README 保留側載與實測免責。
10. 發版：推送 `v*` tag → Actions 跑測試 → `vsce publish` → GitHub Release 附 `.vsix`（secret：`VSCE_PAT`）。
11. DoD：市集可搜可裝、Release 有 VSIX、LICENSE／repository／workflow／README 齊，且 `docs/spec.md` 與地圖改口。

決策紀錄：[ADR 0002](../../../docs/adr/0002-vs-marketplace-publish.md)
