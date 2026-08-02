import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveEnvironmentInstallPlan } from "../environmentInstallPlan";

describe("resolveEnvironmentInstallPlan", () => {
  it("uses Astral standalone installer for uv on Windows and macOS", () => {
    const win = resolveEnvironmentInstallPlan("uv", "win32");
    assert.equal(win.kind, "shell");
    assert.match(win.summary, /遠端|腳本|PowerShell|ByPass/i);
    assert.match(win.commandOrUrl, /astral\.sh\/uv\/install\.ps1/);

    const mac = resolveEnvironmentInstallPlan("uv", "darwin");
    assert.equal(mac.kind, "shell");
    assert.match(mac.summary, /遠端|腳本|curl/i);
    assert.match(mac.commandOrUrl, /astral\.sh\/uv\/install\.sh/);
  });

  it("uses Git for Windows download page and macOS Xcode CLT for git", () => {
    const win = resolveEnvironmentInstallPlan("git", "win32");
    assert.equal(win.kind, "open-url");
    assert.match(win.commandOrUrl, /git-scm\.com\/install\/windows/);
    assert.match(win.summary, /安裝器|installer|下載/i);

    const mac = resolveEnvironmentInstallPlan("git", "darwin");
    assert.equal(mac.kind, "shell");
    assert.equal(mac.commandOrUrl, "xcode-select --install");
    assert.match(mac.summary, /Xcode|Command Line/i);
  });

  it("uses Node.js official LTS download page for both platforms", () => {
    const win = resolveEnvironmentInstallPlan("node", "win32");
    assert.equal(win.kind, "open-url");
    assert.match(win.commandOrUrl, /nodejs\.org/);
    assert.match(win.summary, /LTS|\.msi|安裝器/i);

    const mac = resolveEnvironmentInstallPlan("node", "darwin");
    assert.equal(mac.kind, "open-url");
    assert.match(mac.commandOrUrl, /nodejs\.org/);
    assert.match(mac.summary, /LTS|\.pkg|安裝器/i);
  });
});
