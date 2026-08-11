import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EnvironmentLaneService,
  type EnvironmentInstallDeps,
  type ProbeRunner,
} from "../environmentLane";
import type { EnvironmentInstallPlan } from "../environmentInstallPlan";
import type { ToolProbeInput } from "../toolProbe";

function alwaysMissingProbe(): ProbeRunner {
  return async (): Promise<ToolProbeInput> => ({ exitCode: 1, stdout: "" });
}

function makeDeps(
  overrides: Partial<EnvironmentInstallDeps> = {},
): EnvironmentInstallDeps {
  return {
    platform: "win32",
    confirm: async () => true,
    execute: async () => ({ ok: true }),
    ...overrides,
  };
}

describe("EnvironmentLaneService install flow", () => {
  it("does not install when the student cancels confirm", async () => {
    let executed = false;
    const lane = new EnvironmentLaneService(alwaysMissingProbe(), makeDeps({
      confirm: async () => false,
      execute: async () => {
        executed = true;
        return { ok: true };
      },
    }));
    await lane.recheck();
    const result = await lane.installTool("uv");
    assert.equal(result, "cancelled");
    assert.equal(executed, false);
    assert.equal(lane.getView().tools.find((t) => t.id === "uv")?.status, "missing");
  });

  it("marks needs-reopen-terminal after install completes, not ready", async () => {
    const lane = new EnvironmentLaneService(alwaysMissingProbe(), makeDeps());
    await lane.recheck();
    const result = await lane.installTool("uv");
    assert.equal(result, "ran");
    const uv = lane.getView().tools.find((t) => t.id === "uv");
    assert.equal(uv?.status, "needs-reopen-terminal");
    assert.match(uv?.detail ?? "", /重開終端/);
    assert.equal(lane.getReadiness().uv, false);
  });

  it("becomes ready only after recheck succeeds", async () => {
    let uvReady = false;
    const probe: ProbeRunner = async (tool) => {
      if (tool !== "uv") {
        return {
          exitCode: 0,
          stdout: tool === "git" ? "git version 2.0\n" : "v22\n",
          ...(tool === "node" ? { npm: { exitCode: 0, stdout: "10\n" } } : {}),
        };
      }
      return uvReady
        ? { exitCode: 0, stdout: "uv 0.7.12\n" }
        : { exitCode: 1, stdout: "" };
    };
    const lane = new EnvironmentLaneService(probe, makeDeps());
    await lane.recheck();
    await lane.installTool("uv");
    assert.equal(
      lane.getView().tools.find((t) => t.id === "uv")?.status,
      "needs-reopen-terminal",
    );

    uvReady = true;
    await lane.recheck();
    const uv = lane.getView().tools.find((t) => t.id === "uv");
    assert.equal(uv?.status, "ready");
    assert.equal(uv?.detail, "0.7.12");
  });

  it("keeps error and IT hint on permission/MDM failure without elevating", async () => {
    const lane = new EnvironmentLaneService(
      alwaysMissingProbe(),
      makeDeps({
        execute: async () => ({
          ok: false,
          detail: "Access denied by MDM",
        }),
      }),
    );
    await lane.recheck();
    const result = await lane.installTool("git");
    assert.equal(result, "failed");
    const git = lane.getView().tools.find((t) => t.id === "git");
    assert.equal(git?.status, "failed");
    assert.match(git?.detail ?? "", /IT|管理員|權限|MDM/i);
    assert.match(git?.detail ?? "", /Access denied by MDM/);

    await lane.recheck();
    const afterRecheck = lane.getView().tools.find((t) => t.id === "git");
    assert.equal(afterRecheck?.status, "failed");
    assert.match(afterRecheck?.detail ?? "", /IT|管理員/i);
  });

  it("uses winget shell plan for git on Windows when winget is available", async () => {
    let seenPlan: EnvironmentInstallPlan | undefined;
    const lane = new EnvironmentLaneService(
      alwaysMissingProbe(),
      makeDeps({
        wingetAvailable: async () => true,
        execute: async (plan) => {
          seenPlan = plan;
          return { ok: true };
        },
      }),
    );
    await lane.recheck();
    await lane.installTool("git");
    assert.equal(seenPlan?.kind, "shell");
    assert.match(seenPlan?.commandOrUrl ?? "", /winget install --id Git\.Git/);
  });

  it("opens Git download page when winget is unavailable", async () => {
    let seenPlan: EnvironmentInstallPlan | undefined;
    const lane = new EnvironmentLaneService(
      alwaysMissingProbe(),
      makeDeps({
        wingetAvailable: async () => false,
        execute: async (plan) => {
          seenPlan = plan;
          return { ok: true };
        },
      }),
    );
    await lane.recheck();
    await lane.installTool("git");
    assert.equal(seenPlan?.kind, "open-url");
    assert.match(seenPlan?.commandOrUrl ?? "", /git-scm\.com/);
  });

  it("allows repair on a ready tool via the same reopen-terminal flow", async () => {
    const probe: ProbeRunner = async (tool) => {
      if (tool === "uv") {
        return { exitCode: 0, stdout: "uv 0.7.12\n" };
      }
      if (tool === "git") {
        return { exitCode: 0, stdout: "git version 2.0\n" };
      }
      return {
        exitCode: 0,
        stdout: "v22\n",
        npm: { exitCode: 0, stdout: "10\n" },
      };
    };
    let seenPlan: EnvironmentInstallPlan | undefined;
    const lane = new EnvironmentLaneService(
      probe,
      makeDeps({
        execute: async (plan) => {
          seenPlan = plan;
          return { ok: true };
        },
      }),
    );
    await lane.recheck();
    assert.equal(lane.getView().tools.find((t) => t.id === "uv")?.status, "ready");

    await lane.installTool("uv");
    assert.ok(seenPlan);
    assert.equal(seenPlan?.tool, "uv");
    assert.equal(
      lane.getView().tools.find((t) => t.id === "uv")?.status,
      "needs-reopen-terminal",
    );
    assert.equal(lane.getReadiness().uv, false);
  });
});
