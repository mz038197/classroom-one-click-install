import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { actionKindLabel, parseCourseCatalog } from "../courseCatalog";

describe("parseCourseCatalog", () => {
  it("parses valid actions with required kind and optional description", () => {
    const result = parseCourseCatalog(`
actions:
  - id: peas-agent-tools
    title: 安裝 peas-agent-tools
    kind: package
    description: 從 GitHub 加入專案依賴
    command: uv add peas-agent-tools
  - id: skills
    title: 安裝 skills
    kind: skill
    command: npx skills add x
  - id: mcp-demo
    title: 安裝 MCP
    kind: mcp
    command: echo mcp
`);
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }
    assert.deepEqual(result.actions, [
      {
        id: "peas-agent-tools",
        title: "安裝 peas-agent-tools",
        kind: "package",
        description: "從 GitHub 加入專案依賴",
        command: "uv add peas-agent-tools",
      },
      {
        id: "skills",
        title: "安裝 skills",
        kind: "skill",
        command: "npx skills add x",
      },
      {
        id: "mcp-demo",
        title: "安裝 MCP",
        kind: "mcp",
        command: "echo mcp",
      },
    ]);
  });

  it("rejects missing kind", () => {
    const result = parseCourseCatalog(`
actions:
  - id: runtime
    title: 安裝 runtime
    command: uv add runtime
`);
    assert.equal(result.ok, false);
    if (result.ok) {
      return;
    }
    assert.match(result.error, /kind/);
  });

  it("rejects illegal kind values", () => {
    const result = parseCourseCatalog(`
actions:
  - id: runtime
    title: 安裝 runtime
    kind: module
    command: uv add runtime
`);
    assert.equal(result.ok, false);
    if (result.ok) {
      return;
    }
    assert.match(result.error, /kind/);
  });

  it("rejects missing actions key", () => {
    const result = parseCourseCatalog("foo: 1\n");
    assert.equal(result.ok, false);
    if (result.ok) {
      return;
    }
    assert.match(result.error, /actions/);
  });

  it("rejects actions missing required fields", () => {
    const result = parseCourseCatalog(`
actions:
  - id: only-id
    title: 缺 command
    kind: package
`);
    assert.equal(result.ok, false);
  });

  it("rejects invalid yaml", () => {
    const result = parseCourseCatalog("actions: [\n");
    assert.equal(result.ok, false);
  });

  it("maps kind to student-facing labels", () => {
    assert.equal(actionKindLabel("skill"), "Skill");
    assert.equal(actionKindLabel("package"), "套件");
    assert.equal(actionKindLabel("mcp"), "MCP");
  });
});
