import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ActionRunStateStore } from "../actionRunState";

describe("ActionRunStateStore", () => {
  it("defaults to idle per action id", () => {
    const store = new ActionRunStateStore();
    assert.equal(store.get("a").status, "idle");
  });

  it("tracks running then succeeded on exit 0", () => {
    const store = new ActionRunStateStore();
    store.markRunning("a");
    assert.equal(store.get("a").status, "running");
    store.markFinished("a", 0);
    assert.equal(store.get("a").status, "succeeded");
  });

  it("marks failed on non-zero exit and unverified when exit is unknown", () => {
    const store = new ActionRunStateStore();
    store.markRunning("a");
    store.markFinished("a", 1);
    assert.equal(store.get("a").status, "failed");
    assert.match(store.get("a").detail ?? "", /失敗/);

    store.markRunning("b");
    store.markFinished("b", undefined);
    assert.equal(store.get("b").status, "unverified");
    assert.match(store.get("b").detail ?? "", /未驗證/);
  });

  it("uses git+ failure hint only for git+ commands", () => {
    const store = new ActionRunStateStore();
    store.markRunning("g");
    store.markFinished("g", 1, "uv add git+https://example.com/x.git");
    assert.match(store.get("g").detail ?? "", /git/);
  });

  it("keeps states distinct per action id", () => {
    const store = new ActionRunStateStore();
    store.markRunning("a");
    store.markFinished("a", 0);
    store.markRunning("b");
    store.markFinished("b", 2);
    assert.equal(store.get("a").status, "succeeded");
    assert.equal(store.get("b").status, "failed");
  });

  it("allows rerun after success and retry after failure", () => {
    const store = new ActionRunStateStore();
    store.markRunning("a");
    store.markFinished("a", 0);
    store.markRunning("a");
    assert.equal(store.get("a").status, "running");
    store.markFinished("a", 1);
    store.markRunning("a");
    assert.equal(store.get("a").status, "running");
  });
});
