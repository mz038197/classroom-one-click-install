import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import { resolveEditorUserDir } from "../editorUserPath";

describe("resolveEditorUserDir", () => {
  it("resolves VS Code stable on Windows", () => {
    const dir = resolveEditorUserDir({
      platform: "win32",
      uriScheme: "vscode",
      env: { APPDATA: "C:\\Users\\demo\\AppData\\Roaming" },
      homedir: () => "C:\\Users\\demo",
    });
    assert.equal(dir, path.join("C:\\Users\\demo\\AppData\\Roaming", "Code", "User"));
  });

  it("resolves Cursor on macOS", () => {
    const dir = resolveEditorUserDir({
      platform: "darwin",
      uriScheme: "cursor",
      env: {},
      homedir: () => "/Users/demo",
    });
    assert.equal(
      dir,
      path.join("/Users/demo", "Library", "Application Support", "Cursor", "User"),
    );
  });
});
