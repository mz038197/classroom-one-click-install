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

  it("uses winget for git on Windows when available", () => {
    const win = resolveEnvironmentInstallPlan("git", "win32", {
      wingetAvailable: true,
    });
    assert.equal(win.kind, "shell");
    assert.equal(
      win.commandOrUrl,
      "winget install --id Git.Git -e --accept-package-agreements --accept-source-agreements",
    );
    assert.match(win.summary, /winget/i);
  });

  it("falls back to Git for Windows download page without winget", () => {
    const win = resolveEnvironmentInstallPlan("git", "win32", {
      wingetAvailable: false,
    });
    assert.equal(win.kind, "open-url");
    assert.match(win.commandOrUrl, /git-scm\.com\/install\/windows/);
    assert.match(win.summary, /安裝器|installer|下載/i);

    const mac = resolveEnvironmentInstallPlan("git", "darwin");
    assert.equal(mac.kind, "shell");
    assert.equal(mac.commandOrUrl, "xcode-select --install");
    assert.match(mac.summary, /Xcode|Command Line/i);
  });

  it("uses winget for Node.js LTS on Windows when available", () => {
    const win = resolveEnvironmentInstallPlan("node", "win32", {
      wingetAvailable: true,
    });
    assert.equal(win.kind, "shell");
    assert.equal(
      win.commandOrUrl,
      "winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements",
    );
    assert.match(win.summary, /winget/i);
  });

  it("falls back to Node.js official LTS download page without winget", () => {
    const win = resolveEnvironmentInstallPlan("node", "win32", {
      wingetAvailable: false,
    });
    assert.equal(win.kind, "open-url");
    assert.match(win.commandOrUrl, /nodejs\.org/);
    assert.match(win.summary, /LTS|\.msi|安裝器/i);
  });

  it("installs Node on macOS via unpinned nvm then current LTS", () => {
    const mac = resolveEnvironmentInstallPlan("node", "darwin");
    assert.equal(mac.kind, "shell");
    assert.match(mac.commandOrUrl, /nvm-sh\/nvm\/master\/install\.sh/);
    assert.doesNotMatch(mac.commandOrUrl, /v0\.\d+\.\d+/);
    assert.match(mac.commandOrUrl, /nvm install --lts/);
    assert.match(mac.commandOrUrl, /nvm alias default ['"]lts\/\*['"]/);
    assert.match(mac.summary, /nvm|LTS|遠端|腳本/i);
    assert.doesNotMatch(mac.commandOrUrl, /nodejs\.org/);
    assert.match(mac.previewCommand ?? "", /install\.sh/);
  });
});
