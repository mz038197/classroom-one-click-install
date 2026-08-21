import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { copyLessonSnippet } from "../copyLessonSnippet";

describe("copyLessonSnippet", () => {
  it("writes the matching snippet body to the clipboard", async () => {
    let clipboard = "";
    const result = await copyLessonSnippet({
      snippetId: "stub",
      snippets: [
        { id: "other", title: "Other", body: "nope" },
        { id: "stub", title: "骨架", body: "  def call():\n    pass\n" },
      ],
      writeClipboard: async (text) => {
        clipboard = text;
      },
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.title, "骨架");
    }
    assert.equal(clipboard, "  def call():\n    pass\n");
  });

  it("fails without writing when the snippet is missing", async () => {
    let wrote = false;
    const result = await copyLessonSnippet({
      snippetId: "missing",
      snippets: [{ id: "stub", title: "骨架", body: "print(1)" }],
      writeClipboard: async () => {
        wrote = true;
      },
    });
    assert.equal(result.ok, false);
    assert.equal(wrote, false);
  });

  it("fails when writing to the clipboard throws", async () => {
    const result = await copyLessonSnippet({
      snippetId: "stub",
      snippets: [{ id: "stub", title: "骨架", body: "print(1)" }],
      writeClipboard: async () => {
        throw new Error("clipboard denied");
      },
    });
    assert.equal(result.ok, false);
  });
});
