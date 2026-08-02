# Grilling: 產品規格大綱與完成定義

Type: grilling
Status: resolved
Blocked by: 01, 02, 03, 04, 05, 06, 07

## Question

最終交接用的產品規格應包含哪些章節、寫到多細才算「可開工」、以及本地圖關閉前的完成定義（Definition of Done）是什麼？須能承接已決的產品偏好與各票答案，並指出規格檔應落在 repo 的何處。

## Answer

### 檔案位置

- 單一規格：`docs/spec.md`
- `.scratch/…` 的研究／票／原型以連結引用，不把正文再複製一份進規格當唯一真相（規格應可獨立閱讀，細節可外連）

### 章節大綱（必寫）

1. 產品摘要  
2. 範圍／非範圍  
3. 概念與用語（連 `CONTEXT.md`）  
4. Course Catalog  
5. Environment Lane  
6. Course Lane  
7. 信任邊界  
8. UI／側邊欄 IA（連原型變體 A）  
9. 技術約束  
10. 驗收標準（至少 5 條可測敘述）

### 本地圖完成定義（DoD）

- `docs/spec.md` 十章齊備，並鏈結已決票／研究／原型  
- 驗收標準 ≥ 5 條  
- **不**要求在本地圖內實作擴充功能；**不**另設「人工簽核」關卡（撰寫完成即達目的地）  
- 撰寫本體由後續 task 票執行（見 frontier）
