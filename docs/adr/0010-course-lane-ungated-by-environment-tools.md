# Course Lane 不因 Environment Tool 未就緒而禁用

課堂 catalog 幾乎全是 `uv`／`git+`，先前「依依賴禁用」會讓本課安裝看起來整區鎖死，探測未就緒（含請重開終端）時也擋得到老師趕進度。我們決定：Environment Lane 與 Course Lane **可並行**。Install Action 不因 uv／git／Node 未就緒而禁用、不拒絕執行、確認框與卡片也不提缺工具；點了就跑，失敗只顯示一般失敗＋終端原文，不解析成「請去裝環境工具」。Toolchain Ready 只當 Environment Lane 徽章。側邊欄順序維持環境工具在上（引導，不是關卡）。此決策撤回 [04](../../.scratch/classroom-one-click-install/issues/04-grilling-environment-lane-behavior.md) 與 spec 舊 DoD「依依賴禁用」對 Course Lane 的約束。

## Considered Options

- **維持依依賴硬禁用**：缺 uv／git 就灰掉對應動作；否決，因其在典型 catalog 下等同整區鎖定。
- **軟提示仍可跑**：確認框或卡片標「uv 尚未就緒」；否決，軟閘門仍像不能點，且把兩條 Lane 重新耦合。
- **失敗後再指路／自動展開 Environment Lane**：否決為本次範圍；與「完全不擋」同一耦合，必要時另案。

## Consequences

- `docs/spec.md` DoD 改為驗證「缺工具時本課動作仍可點、仍會執行」。
- Course Lane 不再讀取 Environment Tool readiness 來組 `disabledReason`。
