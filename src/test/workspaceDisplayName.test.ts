import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { workspaceDisplayName } from "../workspaceDisplayName";

describe("workspaceDisplayName", () => {
  it("returns the folder name for a single workspace folder", () => {
    assert.equal(
      workspaceDisplayName([{ name: "my-course-project" }]),
      "my-course-project",
    );
  });

  it("returns a no-workspace label when folders are missing", () => {
    assert.equal(workspaceDisplayName(undefined), "無工作區");
    assert.equal(workspaceDisplayName([]), "無工作區");
  });

  it("uses the first folder name for multi-root workspaces", () => {
    assert.equal(
      workspaceDisplayName([{ name: "primary" }, { name: "secondary" }]),
      "primary",
    );
  });
});
