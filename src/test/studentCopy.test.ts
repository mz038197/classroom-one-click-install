import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classroomApiKeyReadyDetail,
  clearClassroomConnectionBusyMessage,
  copyClassroomApiKeyFailureMessage,
  copyClassroomApiKeySuccessMessage,
  copyLessonSnippetFailureMessage,
  copyLessonSnippetSuccessMessage,
} from "../studentCopy";

describe("studentCopy", () => {
  it("busy clear message stays student-facing without SQLite jargon", () => {
    const text = clearClassroomConnectionBusyMessage();
    assert.equal(
      text,
      "無法清除課堂連線（本機忙碌）。請重新啟動後再試一次清除。",
    );
    assert.doesNotMatch(text, /database is locked/i);
  });

  it("ready and copy messages stay short and never echo the key body", () => {
    assert.equal(classroomApiKeyReadyDetail(), "Classroom API Key 已設定。");
    assert.equal(
      copyClassroomApiKeySuccessMessage(),
      "已複製 Classroom API Key。請勿分享給不信任的人。",
    );
    assert.equal(
      copyClassroomApiKeyFailureMessage(),
      "無法複製 Classroom API Key。請重新連線後再試。",
    );
    for (const text of [
      classroomApiKeyReadyDetail(),
      copyClassroomApiKeySuccessMessage(),
      copyClassroomApiKeyFailureMessage(),
    ]) {
      assert.doesNotMatch(text, /vcr_sk_|pegasi_sk_/);
    }
  });

  it("snippet copy messages name the title and never echo the body", () => {
    assert.equal(copyLessonSnippetSuccessMessage("MCP 客戶端骨架"), "已複製「MCP 客戶端骨架」。");
    assert.equal(copyLessonSnippetFailureMessage(), "無法複製本課片段。");
    assert.doesNotMatch(
      copyLessonSnippetSuccessMessage("MCP 客戶端骨架"),
      /def |print\(/,
    );
  });
});
