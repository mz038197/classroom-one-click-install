import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildRelaunchAfterQuitPlan } from "../relaunchHost";

describe("buildRelaunchAfterQuitPlan", () => {
  it("delays then starts Code.exe on Windows", () => {
    const plan = buildRelaunchAfterQuitPlan({
      platform: "win32",
      execPath: String.raw`C:\Programs\Code.exe`,
      openPath: String.raw`C:\class\repo`,
      comSpec: "cmd.exe",
    });
    assert.equal(plan.command, "cmd.exe");
    assert.equal(plan.args[0], "/d");
    assert.match(plan.args[3]!, /ping -n 2/);
    assert.match(plan.args[3]!, /Code\.exe/);
    assert.match(plan.args[3]!, /class\\repo/);
  });

  it("sleeps then execs on macOS/Linux", () => {
    const plan = buildRelaunchAfterQuitPlan({
      platform: "darwin",
      execPath: "/Applications/Visual Studio Code.app/Contents/MacOS/Electron",
      openPath: "/Users/stu/repo",
    });
    assert.equal(plan.command, "/bin/sh");
    assert.match(plan.args[1]!, /^sleep 1; exec /);
    assert.match(plan.args[1]!, /Visual Studio Code/);
    assert.match(plan.args[1]!, /Users\/stu\/repo/);
  });
});
