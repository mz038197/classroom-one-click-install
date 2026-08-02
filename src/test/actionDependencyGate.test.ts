import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { disabledReasonForAction } from "../actionDependencyGate";

const allReady = { uv: true, git: true, node: true };

describe("disabledReasonForAction", () => {
  it("disables uv/uvx commands when uv is missing", () => {
    const tools = { uv: false, git: true, node: true };
    assert.match(
      disabledReasonForAction("uv add foo", tools) ?? "",
      /uv/,
    );
    assert.match(
      disabledReasonForAction("uvx --from git+https://x/y.git tool", tools) ?? "",
      /uv/,
    );
  });

  it("disables git+ commands when git is missing", () => {
    const reason = disabledReasonForAction(
      "uv add git+https://github.com/org/repo.git",
      { uv: true, git: false, node: true },
    );
    assert.match(reason ?? "", /git/);
  });

  it("disables commands that obviously need git when git is missing", () => {
    const reason = disabledReasonForAction("git clone https://example.com/x.git", {
      uv: true,
      git: false,
      node: true,
    });
    assert.match(reason ?? "", /git/);
  });

  it("does not disable course actions when only Node is missing", () => {
    assert.equal(
      disabledReasonForAction("uv add foo", {
        uv: true,
        git: true,
        node: false,
      }),
      undefined,
    );
    assert.equal(
      disabledReasonForAction(
        "uv add git+https://github.com/org/repo.git",
        { uv: true, git: true, node: false },
      ),
      undefined,
    );
  });

  it("does not lock the whole course lane when toolchain is incomplete", () => {
    assert.equal(
      disabledReasonForAction("uv add foo", {
        uv: true,
        git: false,
        node: false,
      }),
      undefined,
    );
  });

  it("allows actions when required tools are ready", () => {
    assert.equal(
      disabledReasonForAction("uv add foo", allReady),
      undefined,
    );
    assert.equal(
      disabledReasonForAction(
        "uvx --from git+https://github.com/org/repo.git add-thing",
        allReady,
      ),
      undefined,
    );
  });

  it("prefers uv reason when both uv and git are missing for a uv+git command", () => {
    const reason = disabledReasonForAction(
      "uv add git+https://github.com/org/repo.git",
      { uv: false, git: false, node: true },
    );
    assert.match(reason ?? "", /uv/);
  });
});
