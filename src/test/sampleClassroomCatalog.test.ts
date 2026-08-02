import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { parseCourseCatalog } from "../courseCatalog";

const samplePath = path.join(
  __dirname,
  "..",
  "..",
  "samples",
  "classroom-installs.yaml",
);

describe("samples/classroom-installs.yaml", () => {
  it("parses as a valid Course Catalog with the three spec example actions", () => {
    const source = readFileSync(samplePath, "utf8");
    const result = parseCourseCatalog(source);
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.deepEqual(
      result.actions.map((a) => a.id),
      ["peas-agent-tools", "peas-agent-runtime", "dataset-streamlit-shell"],
    );
    assert.ok(result.actions.every((a) => a.command.includes("uv")));
  });
});
