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
    });
    assert.deepEqual(
      view.tools.map((t) => ({ id: t.id, label: t.label, detail: t.detail })),
      [
        { id: "uv", label: "uv", detail: "0.7.12" },
        { id: "git", label: "git", detail: "未安裝" },
        { id: "node", label: "Node.js", detail: "v22.11.0" },
      ],
    );
    assert.equal(view.toolchainReady, false);
  });

  it("marks Toolchain Ready only when all three tools are ready", () => {
    assert.equal(
      buildEnvironmentLaneView({
        uv: { status: "ready", version: "1" },
        git: { status: "ready", version: "2" },
        node: { status: "ready", version: "3" },
      }).toolchainReady,
      true,
    );
  });

  it("suggests reopening the integrated terminal when any tool is missing", () => {
    const view = buildEnvironmentLaneView({
      uv: { status: "missing" },
      git: { status: "ready", version: "2" },
      node: { status: "ready", version: "3" },
    });
    assert.match(view.tip ?? "", /終端/);
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
    assert.equal(lane.getView().toolchainReady, true);
  });

  it("does not mark Toolchain Ready when only Node is missing", async () => {
    const probe: ProbeRunner = async (tool) => {
      if (tool === "node") {
        return { exitCode: 1, stdout: "" };
      }
      if (tool === "uv") {
        return { exitCode: 0, stdout: "uv 0.7.12\n" };
      }
      return { exitCode: 0, stdout: "git version 2.45.1\n" };
    };
    const lane = new EnvironmentLaneService(probe);
    await lane.recheck();
    const view = lane.getView();
    assert.equal(view.tools.find((t) => t.id === "uv")?.status, "ready");
    assert.equal(view.tools.find((t) => t.id === "git")?.status, "ready");
    assert.equal(view.tools.find((t) => t.id === "node")?.status, "missing");
    assert.equal(view.toolchainReady, false);
  });
});
