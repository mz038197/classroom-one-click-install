import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveEnvironmentInstallPlan } from "../environmentInstallPlan";
import { buildEnvironmentInstallConfirm } from "../environmentInstallConfirm";

describe("buildEnvironmentInstallConfirm", () => {
  it("uses a fixed batch title and lists each selected plan", () => {
    const items = [
      {
        plan: resolveEnvironmentInstallPlan("uv", "win32"),
        mode: "missing" as const,
      },
      {
        plan: resolveEnvironmentInstallPlan("git", "win32", { wingetAvailable: true }),
        mode: "ready" as const,
      },
    ];
    const confirm = buildEnvironmentInstallConfirm(items);
    assert.equal(confirm.title, "安裝所選環境工具");
    assert.match(confirm.detail, /將執行：/);
    assert.match(confirm.detail, /astral\.sh\/uv\/install\.ps1/);
    assert.match(confirm.detail, /先檢視|preview|more/i);
    assert.match(confirm.detail, /winget install --id Git\.Git/);
    assert.match(confirm.detail, /重新安裝／修復/);
  });

  it("separates shell commands from open-url plans in one confirm", () => {
    const confirm = buildEnvironmentInstallConfirm([
      {
        plan: resolveEnvironmentInstallPlan("uv", "win32"),
        mode: "missing",
      },
      {
        plan: resolveEnvironmentInstallPlan("node", "win32", {
          wingetAvailable: false,
        }),
        mode: "missing",
      },
      {
        plan: resolveEnvironmentInstallPlan("pwsh", "darwin"),
        mode: "missing",
      },
    ]);
    assert.equal(confirm.title, "安裝所選環境工具");
    assert.match(confirm.detail, /將執行：/);
    assert.match(confirm.detail, /將開啟：/);
    assert.match(confirm.detail, /nodejs\.org/i);
    assert.match(
      confirm.detail,
      /learn\.microsoft\.com\/powershell\/scripting\/install\/install-powershell-on-macos/,
    );
    assert.match(confirm.detail, /nvm|ByPass|遠端|腳本/i);
  });
});
