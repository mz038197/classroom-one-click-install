import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clearClassroomConnectionBusyMessage } from "../studentCopy";

describe("studentCopy", () => {
  it("busy clear message stays student-facing without SQLite jargon", () => {
    const text = clearClassroomConnectionBusyMessage();
    assert.equal(
      text,
      "無法清除課堂連線（本機忙碌）。請重新啟動後再試一次清除。",
    );
    assert.doesNotMatch(text, /database is locked/i);
  });
});
