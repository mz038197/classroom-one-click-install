import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getSidebarWebviewHtml } from "../sidebarWebviewHtml";

describe("getSidebarWebviewHtml", () => {
  it("loads sidebar.js via CSP-friendly script src", () => {
    const html = getSidebarWebviewHtml(
      "https://file+.vscode-resource.vscode-cdn.net",
      "https://file+.vscode-resource.vscode-cdn.net/media/sidebar.js",
    );
    assert.match(html, /script-src https:\/\/file\+\.vscode-resource/);
    assert.match(html, /src="https:\/\/file\+\.vscode-resource\.vscode-cdn\.net\/media\/sidebar\.js"/);
    assert.doesNotMatch(html, /<script nonce=/);
    assert.match(html, /載入中/);
    assert.match(html, /\.lane\.collapsed/);
    assert.match(html, /\.kind-tag/);
    assert.match(html, /\.snippet-pre/);
    assert.match(html, /\.logo-badge/);
    assert.match(html, /\.gradient-text/);
    assert.match(html, /#007070/);
    assert.match(html, /#f8c000/);
  });
});
