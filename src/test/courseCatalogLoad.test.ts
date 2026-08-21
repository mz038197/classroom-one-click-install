import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FALLBACK_TIP, loadCourseCatalog } from "../courseCatalogLoad";

const EMPTY = "actions: []\n";
const ONE = `
actions:
  - id: demo
    title: Demo
    kind: package
    command: uv add demo
`;

describe("loadCourseCatalog", () => {
  it("uses session catalog when remote succeeds (including empty actions)", async () => {
    const result = await loadCourseCatalog({
      apiKey: "vcr_sk_x",
      fetchRemoteYaml: async () => EMPTY,
      readWorkspaceYaml: async () => ONE,
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.source, "session");
    assert.equal(result.actions.length, 0);
    assert.equal(result.canRetryRemote, true);
    assert.equal(result.tip, undefined);
  });

  it("falls back to workspace when remote fails and key exists", async () => {
    const result = await loadCourseCatalog({
      apiKey: "vcr_sk_x",
      fetchRemoteYaml: async () => {
        throw new Error("network");
      },
      readWorkspaceYaml: async () => ONE,
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.source, "workspace");
    assert.equal(result.actions[0]?.id, "demo");
    assert.equal(result.tip, FALLBACK_TIP);
    assert.equal(result.canRetryRemote, true);
  });

  it("uses workspace without tip when no api key", async () => {
    const result = await loadCourseCatalog({
      apiKey: undefined,
      fetchRemoteYaml: async () => {
        throw new Error("should not call");
      },
      readWorkspaceYaml: async () => ONE,
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.source, "workspace");
    assert.equal(result.tip, undefined);
    assert.equal(result.canRetryRemote, false);
  });

  it("falls back when remote YAML is invalid", async () => {
    const result = await loadCourseCatalog({
      apiKey: "pegasi_sk_x",
      fetchRemoteYaml: async () => "not: valid: catalog",
      readWorkspaceYaml: async () => ONE,
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.source, "workspace");
    assert.equal(result.canRetryRemote, true);
  });

  it("loads snippets from session catalog together with actions", async () => {
    const result = await loadCourseCatalog({
      apiKey: "vcr_sk_x",
      fetchRemoteYaml: async () => `
actions: []
snippets:
  - id: stub
    title: 骨架
    body: "print(1)\\n"
`,
      readWorkspaceYaml: async () => ONE,
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.source, "session");
    assert.equal(result.actions.length, 0);
    assert.equal(result.snippets.length, 1);
    assert.equal(result.snippets[0]?.id, "stub");
    assert.equal(result.snippets[0]?.body, "print(1)\n");
  });
});
