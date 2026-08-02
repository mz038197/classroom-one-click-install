import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSidebarViewModel } from "../sidebarViewModel";
import type { CourseLaneView } from "../courseLaneTypes";
import type { EnvironmentLaneView } from "../environmentLane";

const envReady: EnvironmentLaneView = {
  toolchainReady: true,
  tools: [
    {
      id: "uv",
      label: "uv",
      status: "ready",
      detail: "0.7.0",
      actionLabel: "重新安裝／修復",
    },
    {
      id: "git",
      label: "git",
      status: "ready",
      detail: "2.45.0",
      actionLabel: "重新安裝／修復",
    },
    {
      id: "node",
      label: "Node.js",
      status: "ready",
      detail: "v22.0.0",
      actionLabel: "重新安裝／修復",
    },
  ],
};

describe("buildSidebarViewModel", () => {
  it("places environment above course and keeps shell titles", () => {
    const course: CourseLaneView = {
      kind: "ready",
      workspaceRoot: "/tmp/demo",
      actions: [
        {
          id: "a1",
          title: "安裝 tools",
          description: "從 GitHub",
          command: "uv add x",
          run: { status: "idle" },
        },
      ],
    };

    const vm = buildSidebarViewModel({
      workspaceName: "demo",
      environment: envReady,
      course,
    });

    assert.equal(vm.title, "凡思課堂安裝");
    assert.equal(vm.workspaceLabel, "工作區：demo");
    assert.equal(vm.environment.tools.length, 3);
    assert.equal(vm.course.actions[0]?.title, "安裝 tools");
    assert.equal(vm.course.actions[0]?.actionLabel, "安裝");
    assert.equal(vm.hasCustomCommandInput, false);
  });

  it("surfaces disabled reason and does not offer a run label action", () => {
    const course: CourseLaneView = {
      kind: "ready",
      workspaceRoot: "/tmp/demo",
      actions: [
        {
          id: "needs-git",
          title: "安裝 runtime",
          command: "uv add git+https://example.com/x.git",
          run: { status: "idle" },
          disabledReason: "需要 git",
        },
      ],
    };

    const vm = buildSidebarViewModel({
      workspaceName: "demo",
      environment: envReady,
      course,
    });

    assert.equal(vm.course.actions[0]?.disabledReason, "需要 git");
    assert.equal(vm.course.actions[0]?.busy, false);
    assert.equal(vm.course.actions[0]?.canRun, false);
  });

  it("maps course empty states to a clear message", () => {
    const vm = buildSidebarViewModel({
      workspaceName: "none",
      environment: envReady,
      course: { kind: "missing", message: "找不到 classroom-installs.yaml" },
    });
    assert.match(vm.course.emptyMessage ?? "", /找不到/);
    assert.equal(vm.course.actions.length, 0);
  });

  it("marks installing env tools and running actions as busy", () => {
    const env: EnvironmentLaneView = {
      toolchainReady: false,
      tip: "請重開終端",
      tools: [
        {
          id: "uv",
          label: "uv",
          status: "installing",
          detail: "安裝中…",
          actionLabel: "安裝",
        },
        {
          id: "git",
          label: "git",
          status: "missing",
          detail: "未安裝",
          actionLabel: "安裝",
        },
        {
          id: "node",
          label: "Node.js",
          status: "ready",
          detail: "v22",
          actionLabel: "重新安裝／修復",
        },
      ],
    };
    const course: CourseLaneView = {
      kind: "ready",
      workspaceRoot: "/tmp/demo",
      actions: [
        {
          id: "a1",
          title: "安裝 tools",
          command: "uv add x",
          run: { status: "running" },
        },
      ],
    };

    const vm = buildSidebarViewModel({
      workspaceName: "demo",
      environment: env,
      course,
    });

    assert.equal(vm.environment.tools[0]?.busy, true);
    assert.equal(vm.environment.tools[0]?.canRun, false);
    assert.equal(vm.course.actions[0]?.busy, true);
    assert.equal(vm.course.actions[0]?.canRun, false);
    assert.ok(vm.environment.tip);
  });
});
