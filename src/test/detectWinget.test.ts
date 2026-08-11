import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectWingetAvailable } from "../detectWinget";

describe("detectWingetAvailable", () => {
  it("returns the injected probe result", async () => {
    assert.equal(await detectWingetAvailable(async () => true), true);
    assert.equal(await detectWingetAvailable(async () => false), false);
  });
});
