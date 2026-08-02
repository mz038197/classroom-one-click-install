import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { confirmThenRun } from "../confirmThenRun";

describe("confirmThenRun", () => {
  it("does not run when the user cancels", async () => {
    const calls: string[] = [];
    const result = await confirmThenRun(
      {
        confirm: async () => false,
        run: async (cwd, command) => {
          calls.push(`${cwd}::${command}`);
        },
      },
      { command: "uv add demo" },
      "/workspace",
    );
    assert.equal(result, "cancelled");
    assert.deepEqual(calls, []);
  });

  it("runs the full command at workspace root after confirm", async () => {
    const calls: Array<{ cwd: string; command: string }> = [];
    const result = await confirmThenRun(
      {
        confirm: async (command) => {
          assert.equal(command, "uv add demo");
          return true;
        },
        run: async (cwd, command) => {
          calls.push({ cwd, command });
        },
      },
      { command: "uv add demo" },
      "/workspace",
    );
    assert.equal(result, "ran");
    assert.deepEqual(calls, [{ cwd: "/workspace", command: "uv add demo" }]);
  });
});
