import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { describe, it } from "node:test";
import {
  buildRelaunchAfterQuitPlan,
  scheduleRelaunchAfterQuit,
  type RelaunchHostPlan,
} from "../relaunchHost";

describe("buildRelaunchAfterQuitPlan", () => {
  it("delays then Start-Process Code.exe on Windows via PowerShell", () => {
    const plan = buildRelaunchAfterQuitPlan({
      platform: "win32",
      execPath: String.raw`C:\Programs\Code.exe`,
      openPath: String.raw`C:\class\repo`,
    });
    assert.equal(plan.command, "powershell.exe");
    assert.ok(plan.args.includes("-NoProfile"));
    assert.ok(plan.args.includes("-Command"));
    const command = plan.args[plan.args.indexOf("-Command") + 1]!;
    assert.match(command, /Start-Sleep -Seconds 4/);
    assert.match(command, /Start-Process/);
    assert.match(command, /Code\.exe/);
    assert.match(command, /class\\repo/);
  });

  it("escapes single quotes in Windows paths for PowerShell", () => {
    const plan = buildRelaunchAfterQuitPlan({
      platform: "win32",
      execPath: String.raw`C:\O'Brien\Code.exe`,
    });
    const command = plan.args[plan.args.indexOf("-Command") + 1]!;
    assert.match(command, /O''Brien/);
  });

  it("sleeps 4s then execs on macOS/Linux", () => {
    const plan = buildRelaunchAfterQuitPlan({
      platform: "darwin",
      execPath: "/Applications/Visual Studio Code.app/Contents/MacOS/Electron",
      openPath: "/Users/stu/repo",
    });
    assert.equal(plan.command, "/bin/sh");
    assert.match(plan.args[1]!, /^sleep 4; exec /);
    assert.match(plan.args[1]!, /Visual Studio Code/);
    assert.match(plan.args[1]!, /Users\/stu\/repo/);
  });

  it("omits ArgumentList when no workspace folder on Windows", () => {
    const plan = buildRelaunchAfterQuitPlan({
      platform: "win32",
      execPath: String.raw`C:\Programs\Code.exe`,
    });
    const command = plan.args[plan.args.indexOf("-Command") + 1]!;
    assert.doesNotMatch(command, /ArgumentList/);
    assert.match(command, /Start-Process -FilePath/);
  });
});

describe("scheduleRelaunchAfterQuit", () => {
  it("returns true when spawn succeeds and unrefs the child", () => {
    const plan: RelaunchHostPlan = {
      command: "powershell.exe",
      args: ["-Command", "Start-Sleep -Seconds 4"],
    };
    let unrefed = false;
    const child = new EventEmitter() as EventEmitter & {
      unref: () => void;
    };
    child.unref = () => {
      unrefed = true;
    };
    const ok = scheduleRelaunchAfterQuit(plan, () => child as never);
    assert.equal(ok, true);
    assert.equal(unrefed, true);
  });

  it("returns false when spawn throws", () => {
    const plan: RelaunchHostPlan = {
      command: "missing.exe",
      args: [],
    };
    const ok = scheduleRelaunchAfterQuit(plan, () => {
      throw new Error("spawn ENOENT");
    });
    assert.equal(ok, false);
  });
});
