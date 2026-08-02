import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseToolProbeResult } from "../toolProbe";

describe("parseToolProbeResult", () => {
  it("marks uv ready with version from successful stdout", () => {
    const result = parseToolProbeResult("uv", {
      exitCode: 0,
      stdout: "uv 0.7.12 (hatch xyz)\n",
    });
    assert.deepEqual(result, { status: "ready", version: "0.7.12" });
  });

  it("marks git ready with version from successful stdout", () => {
    const result = parseToolProbeResult("git", {
      exitCode: 0,
      stdout: "git version 2.45.1.windows.1\n",
    });
    assert.deepEqual(result, { status: "ready", version: "2.45.1.windows.1" });
  });

  it("marks tool missing on non-zero exit", () => {
    assert.deepEqual(
      parseToolProbeResult("uv", { exitCode: 1, stdout: "" }),
      { status: "missing" },
    );
  });

  it("requires both node and npm for Node readiness", () => {
    assert.deepEqual(
      parseToolProbeResult("node", {
        exitCode: 0,
        stdout: "v22.11.0\n",
        npm: { exitCode: 1, stdout: "" },
      }),
      { status: "missing" },
    );
    assert.deepEqual(
      parseToolProbeResult("node", {
        exitCode: 0,
        stdout: "v22.11.0\n",
        npm: { exitCode: 0, stdout: "10.9.0\n" },
      }),
      { status: "ready", version: "v22.11.0" },
    );
  });
});
