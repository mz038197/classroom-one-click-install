import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const vscodeignore = readFileSync(
  path.join(__dirname, "..", "..", ".vscodeignore"),
  "utf8",
);

describe(".vscodeignore", () => {
  it("excludes agent and repo-only paths from the VSIX", () => {
    for (const pattern of [
      ".agents/**",
      "scripts/**",
      "AGENTS.md",
      "skills-lock.json",
    ]) {
      assert.ok(
        vscodeignore.split(/\r?\n/).includes(pattern),
        `missing ${pattern}`,
      );
    }
  });
});
