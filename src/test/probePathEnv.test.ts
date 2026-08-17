import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildProbeExecEnv,
  buildProbeHostCommand,
  environmentProbeCommands,
  wrapUnixProbeCommand,
} from "../probePathEnv";

describe("wrapUnixProbeCommand", () => {
  it("prepends user bins and nvm before the version command", () => {
    const wrapped = wrapUnixProbeCommand("uv --version");
    assert.match(wrapped, /\$HOME\/\.local\/bin/);
    assert.match(wrapped, /\/opt\/homebrew\/bin/);
    assert.match(wrapped, /nvm\.sh/);
    assert.match(wrapped, /uv --version$/);
  });
});

describe("environmentProbeCommands", () => {
  it("keeps raw version commands on Windows", () => {
    assert.deepEqual(environmentProbeCommands("node", "win32"), [
      "node --version",
      "npm --version",
    ]);
  });

  it("wraps uv/git/node for VS Code unix probe (SI and fallback)", () => {
    const node = environmentProbeCommands("node", "darwin");
    assert.equal(node.length, 2);
    assert.match(node[0]!, /nvm\.sh/);
    assert.match(node[0]!, /node --version$/);
    assert.match(node[1]!, /npm --version$/);
    assert.match(environmentProbeCommands("uv", "darwin")[0]!, /uv --version$/);
    assert.match(environmentProbeCommands("git", "darwin")[0]!, /git --version$/);
  });
});

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

  it("wraps with login shell -lc on macOS", () => {
    assert.equal(
      buildProbeHostCommand({
        platform: "darwin",
        command: "node --version",
        shell: "/bin/zsh",
      }),
      "/bin/zsh -lc 'node --version'",
    );
  });

  it("escapes single quotes in the command for Unix shells", () => {
    const host = buildProbeHostCommand({
      platform: "linux",
      command: "x'y",
      shell: "/bin/sh",
    });
    assert.match(host, /^\/bin\/sh -lc /);
    assert.match(host, /x'\\''y/);
  });

  it("defaults to /bin/bash when SHELL is empty", () => {
    const host = buildProbeHostCommand({
      platform: "linux",
      command: "git --version",
      shell: "",
    });
    assert.match(host, /^\/bin\/bash -lc /);
    assert.match(host, /git --version/);
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
