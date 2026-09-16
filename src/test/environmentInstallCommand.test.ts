import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

describe("command palette Environment Tool install", () => {
  it("does not contribute a student-facing single-tool install command", () => {
    const pkg = JSON.parse(
      readFileSync(path.join(__dirname, "..", "..", "package.json"), "utf8"),
    ) as { contributes: { commands: Array<{ command: string }> } };
    const commands = pkg.contributes.commands.map((c) => c.command);
    assert.ok(
      !commands.includes("vansClassroomInstall.installEnvironmentTool"),
    );
  });
});
