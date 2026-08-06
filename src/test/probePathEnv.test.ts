import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildProbeExecEnv, buildProbeHostCommand } from "../probePathEnv";

describe("buildProbeHostCommand", () => {
  it("leaves the command as-is on Windows (PATH comes from env)", () => {
    assert.equal(
      buildProbeHostCommand({
        platform: "win32",
        command: "uv --version",
      }),
      "uv --version",
    );
  });

  it("wraps with login shell -lc on macOS/Linux", () => {
    assert.equal(
      buildProbeHostCommand({
        platform: "darwin",
        command: "uv --version",
        shell: "/bin/zsh",
      }),
      "/bin/zsh -lc 'uv --version'",
    );
  });

  it("escapes single quotes in the command for Unix shells", () => {
    assert.equal(
      buildProbeHostCommand({
        platform: "linux",
        command: "x'y",
        shell: "/bin/sh",
      }),
      "/bin/sh -lc 'x'\\''y'",
    );
  });

  it("defaults to /bin/bash when SHELL is empty", () => {
    assert.equal(
      buildProbeHostCommand({
        platform: "linux",
        command: "git --version",
        shell: "",
      }),
      "/bin/bash -lc 'git --version'",
    );
  });
});

describe("buildProbeExecEnv", () => {
  it("overrides Path and PATH on Windows when system path is provided", () => {
    const env = buildProbeExecEnv({
      platform: "win32",
      processEnv: { PATH: "stale", Path: "stale", HOME: "x" },
      windowsPath: String.raw`C:\fresh;C:\Users\stu\bin`,
    });
    assert.equal(env.PATH, String.raw`C:\fresh;C:\Users\stu\bin`);
    assert.equal(env.Path, String.raw`C:\fresh;C:\Users\stu\bin`);
    assert.equal(env.HOME, "x");
  });

  it("keeps process env on Unix (login shell carries profile PATH)", () => {
    const processEnv = { PATH: "/usr/bin", SHELL: "/bin/zsh" };
    const env = buildProbeExecEnv({
      platform: "darwin",
      processEnv,
    });
    assert.equal(env.PATH, "/usr/bin");
    assert.equal(env.SHELL, "/bin/zsh");
  });
});
