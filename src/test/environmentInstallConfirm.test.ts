import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveEnvironmentInstallPlan } from "../environmentInstallPlan";
import { buildEnvironmentInstallConfirm } from "../environmentInstallConfirm";

describe("buildEnvironmentInstallConfirm", () => {
  it("labels missing tools as 安裝 and ready/reopen tools as 重新安裝／修復", () => {
    const plan = resolveEnvironmentInstallPlan("uv", "win32");
    const install = buildEnvironmentInstallConfirm(plan, "missing");
    assert.match(install.title, /安裝/);
    assert.doesNotMatch(install.title, /修復/);

    const repair = buildEnvironmentInstallConfirm(plan, "ready");
    assert.match(repair.title, /重新安裝|修復/);

    const reopen = buildEnvironmentInstallConfirm(plan, "needs-reopen-terminal");
    assert.match(reopen.title, /重新安裝|修復/);
  });

  it("includes risk summary and command or download URL in detail", () => {
    const plan = resolveEnvironmentInstallPlan("uv", "win32");
    const confirm = buildEnvironmentInstallConfirm(plan, "missing");
    assert.match(confirm.detail, /遠端|腳本|ByPass/i);
    assert.match(confirm.detail, /astral\.sh\/uv\/install\.ps1/);
    assert.match(confirm.detail, /先檢視|preview|more/i);
  });

  it("mentions system installer risk for open-url plans", () => {
    const plan = resolveEnvironmentInstallPlan("node", "win32", {
      wingetAvailable: false,
    });
    const confirm = buildEnvironmentInstallConfirm(plan, "missing");
    assert.match(confirm.detail, /安裝器|下載|nodejs\.org/i);
    assert.match(confirm.detail, /\.msi|LTS|管理員|UAC/i);
  });

  it("reveals nvm remote script for macOS Node, not a download page", () => {
    const plan = resolveEnvironmentInstallPlan("node", "darwin");
    const confirm = buildEnvironmentInstallConfirm(plan, "missing");
    assert.match(confirm.detail, /nvm/i);
    assert.match(confirm.detail, /install\.sh/);
    assert.match(confirm.detail, /將執行：/);
    assert.doesNotMatch(confirm.detail, /nodejs\.org|\.pkg/);
  });
});
