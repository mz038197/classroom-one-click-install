import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EnvironmentLaneService,
  buildEnvironmentLaneView,
  type ProbeRunner,
} from "../environmentLane";
import type { EnvironmentToolId, ToolProbeInput } from "../toolProbe";

describe("buildEnvironmentLaneView", () => {
  it("shows version or 未安裝 for each Environment Tool", () => {
    const view = buildEnvironmentLaneView({
      uv: { status: "ready", version: "0.7.12" },
      git: { status: "missing" },
      node: { status: "ready", version: "v22.11.0" },
      pwsh: { status: "missing" },
    });
    assert.deepEqual(
      view.tools.map((t) => ({ id: t.id, label: t.label, detail: t.detail })),
      [
        { id: "uv", label: "uv", detail: "0.7.12" },
        { id: "git", label: "git", detail: "未安裝" },
        { id: "node", label: "Node.js", detail: "v22.11.0" },
        { id: "pwsh", label: "PowerShell 7", detail: "未安裝" },
      ],
    );
    assert.equal(view.toolchainReady, false);
  });

  it("marks Toolchain Ready only when all four tools are ready", () => {
    assert.equal(
      buildEnvironmentLaneView({
        uv: { status: "ready", version: "1" },
        git: { status: "ready", version: "2" },
        node: { status: "ready", version: "3" },
        pwsh: { status: "ready", version: "7.4.6" },
      }).toolchainReady,
      true,
    );
    assert.equal(
      buildEnvironmentLaneView({
        uv: { status: "ready", version: "1" },
        git: { status: "ready", version: "2" },
        node: { status: "ready", version: "3" },
        pwsh: { status: "missing" },
      }).toolchainReady,
      false,
    );
  });

  it("suggests reopening the integrated terminal when any tool is missing", () => {
    const view = buildEnvironmentLaneView({
      uv: { status: "missing" },
      git: { status: "ready", version: "2" },
      node: { status: "ready", version: "3" },
      pwsh: { status: "ready", version: "7" },
    });
    assert.match(view.tip ?? "", /終端/);
  });

  it("preselects missing tools and enables the lane install button", () => {
    const view = buildEnvironmentLaneView({
      uv: { status: "missing" },
      git: { status: "missing" },
      node: { status: "missing" },
      pwsh: { status: "missing" },
    });
    assert.deepEqual(
      view.tools.map((t) => ({ id: t.id, selected: t.selected })),
      [
        { id: "uv", selected: true },
        { id: "git", selected: true },
        { id: "node", selected: true },
        { id: "pwsh", selected: true },
      ],
    );
    assert.equal(view.canInstallSelected, true);
    assert.equal(view.selectionLocked, false);
    for (const tool of view.tools) {
      assert.equal("actionLabel" in tool, false);
    }
  });

  it("does not preselect ready tools and disables install when none are checked", () => {
    const view = buildEnvironmentLaneView({
      uv: { status: "ready", version: "1" },
      git: { status: "ready", version: "2" },
      node: { status: "ready", version: "3" },
      pwsh: { status: "ready", version: "7" },
    });
    assert.ok(view.tools.every((t) => t.selected === false));
    assert.equal(view.canInstallSelected, false);
  });

  it("preselects failed overlays and leaves needs-reopen-terminal unchecked", () => {
    const view = buildEnvironmentLaneView(
      {
        uv: { status: "missing" },
        git: { status: "ready", version: "2" },
        node: { status: "missing" },
        pwsh: { status: "missing" },
      },
      {
        uv: { kind: "failed", detail: "boom" },
        git: { kind: "needs-reopen-terminal" },
      },
    );
    assert.equal(view.tools.find((t) => t.id === "uv")?.selected, true);
    assert.equal(view.tools.find((t) => t.id === "git")?.selected, false);
    assert.equal(view.tools.find((t) => t.id === "node")?.selected, true);
    assert.equal(view.canInstallSelected, true);
  });
});

describe("EnvironmentLaneService", () => {
  it("recheck re-probes and reflects newly available tools", async () => {
    let uvReady = false;
    const probe: ProbeRunner = async (tool: EnvironmentToolId): Promise<ToolProbeInput> => {
      if (tool === "uv") {
        return uvReady
          ? { exitCode: 0, stdout: "uv 0.7.12\n" }
          : { exitCode: 1, stdout: "" };
      }
      if (tool === "git") {
        return { exitCode: 0, stdout: "git version 2.45.1\n" };
      }
      if (tool === "pwsh") {
        return { exitCode: 0, stdout: "PowerShell 7.4.6\n" };
      }
      return {
        exitCode: 0,
        stdout: "v22.11.0\n",
        npm: { exitCode: 0, stdout: "10.9.0\n" },
      };
    };

    const lane = new EnvironmentLaneService(probe);
    await lane.recheck();
    assert.equal(lane.getView().tools.find((t) => t.id === "uv")?.detail, "未安裝");

    uvReady = true;
    await lane.recheck();
    assert.equal(lane.getView().tools.find((t) => t.id === "uv")?.detail, "0.7.12");
    assert.equal(lane.getView().toolchainReady, true);
  });

  it("treats a parseable version as ready even when the probe exit is non-zero", async () => {
    const probe: ProbeRunner = async (tool) => {
      if (tool === "uv") {
        return { exitCode: 1, stdout: "uv 0.7.12\n" };
      }
      if (tool === "git") {
        return { exitCode: 1, stdout: "git version 2.45.1\n" };
      }
      if (tool === "pwsh") {
        return { exitCode: 1, stdout: "PowerShell 7.4.6\n" };
      }
      return {
        exitCode: 1,
        stdout: "v22.11.0\n",
        npm: { exitCode: 1, stdout: "10.9.0\n" },
      };
    };
    const lane = new EnvironmentLaneService(probe);
    await lane.recheck();
    assert.equal(lane.getView().tools.find((t) => t.id === "uv")?.status, "ready");
    assert.equal(lane.getView().tools.find((t) => t.id === "git")?.status, "ready");
    assert.equal(lane.getView().tools.find((t) => t.id === "node")?.status, "ready");
    assert.equal(lane.getView().tools.find((t) => t.id === "pwsh")?.status, "ready");
    assert.equal(lane.getView().toolchainReady, true);
  });

  it("does not mark Toolchain Ready when only PowerShell 7 is missing", async () => {
    const probe: ProbeRunner = async (tool) => {
      if (tool === "pwsh") {
        return { exitCode: 1, stdout: "" };
      }
      if (tool === "uv") {
        return { exitCode: 0, stdout: "uv 0.7.12\n" };
      }
      if (tool === "git") {
        return { exitCode: 0, stdout: "git version 2.45.1\n" };
      }
      return {
        exitCode: 0,
        stdout: "v22.11.0\n",
        npm: { exitCode: 0, stdout: "10.9.0\n" },
      };
    };
    const lane = new EnvironmentLaneService(probe);
    await lane.recheck();
    const view = lane.getView();
    assert.equal(view.tools.find((t) => t.id === "uv")?.status, "ready");
    assert.equal(view.tools.find((t) => t.id === "git")?.status, "ready");
    assert.equal(view.tools.find((t) => t.id === "node")?.status, "ready");
    assert.equal(view.tools.find((t) => t.id === "pwsh")?.status, "missing");
    assert.equal(view.toolchainReady, false);
  });

  it("toggleTool flips a ready tool on so repair can join the next batch", async () => {
    const probe: ProbeRunner = async (tool) => {
      if (tool === "uv") {
        return { exitCode: 0, stdout: "uv 0.7.12\n" };
      }
      if (tool === "git") {
        return { exitCode: 0, stdout: "git version 2.45.1\n" };
      }
      if (tool === "pwsh") {
        return { exitCode: 0, stdout: "PowerShell 7.4.6\n" };
      }
      return {
        exitCode: 0,
        stdout: "v22.11.0\n",
        npm: { exitCode: 0, stdout: "10.9.0\n" },
      };
    };
    const lane = new EnvironmentLaneService(probe);
    await lane.recheck();
    assert.equal(lane.getView().canInstallSelected, false);
    lane.toggleTool("uv");
    const view = lane.getView();
    assert.equal(view.tools.find((t) => t.id === "uv")?.selected, true);
    assert.equal(view.canInstallSelected, true);
  });

  it("keeps a ready tool checked across recheck when status does not change", async () => {
    const probe: ProbeRunner = async (tool) => {
      if (tool === "uv") {
        return { exitCode: 0, stdout: "uv 0.7.12\n" };
      }
      if (tool === "git") {
        return { exitCode: 0, stdout: "git version 2.45.1\n" };
      }
      if (tool === "pwsh") {
        return { exitCode: 0, stdout: "PowerShell 7.4.6\n" };
      }
      return {
        exitCode: 0,
        stdout: "v22.11.0\n",
        npm: { exitCode: 0, stdout: "10.9.0\n" },
      };
    };
    const lane = new EnvironmentLaneService(probe);
    await lane.recheck();
    lane.toggleTool("uv");
    await lane.recheck();
    assert.equal(lane.getView().tools.find((t) => t.id === "uv")?.selected, true);
  });
});
