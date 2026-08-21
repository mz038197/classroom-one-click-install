import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { interpretShellInstallExit } from "../environmentInstallOutcome";

describe("interpretShellInstallExit", () => {
  it("treats exit 0 as success", () => {
    assert.deepEqual(
      interpretShellInstallExit({
        tool: "uv",
        platform: "darwin",
        exitCode: 0,
        output: "",
      }),
      { ok: true },
    );
  });

  it("treats missing exit code as unverified success", () => {
    assert.deepEqual(
      interpretShellInstallExit({
        tool: "git",
        platform: "darwin",
        exitCode: undefined,
        output: "",
      }),
      { ok: true },
    );
  });

  it("treats macOS git already-installed as success, not failure", () => {
    assert.deepEqual(
      interpretShellInstallExit({
        tool: "git",
        platform: "darwin",
        exitCode: 1,
        output:
          "xcode-select: error: command line tools are already installed, use \"Software Update\" to install updates\n",
      }),
      { ok: true },
    );
  });

  it("does not treat a generic non-zero exit as already installed", () => {
    const result = interpretShellInstallExit({
      tool: "uv",
      platform: "darwin",
      exitCode: 1,
      output: "curl: (6) Could not resolve host: astral.sh\n",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.detail, /結束碼 1/);
    }
  });

  it("does not treat a generic already-installed phrase without xcode-select as success", () => {
    const result = interpretShellInstallExit({
      tool: "git",
      platform: "darwin",
      exitCode: 1,
      output: "package already installed\n",
    });
    assert.equal(result.ok, false);
  });

  it("does not treat git already-installed text on Windows as that macOS signal", () => {
    const result = interpretShellInstallExit({
      tool: "git",
      platform: "win32",
      exitCode: 1,
      output: "command line tools are already installed\n",
    });
    assert.equal(result.ok, false);
  });
});
