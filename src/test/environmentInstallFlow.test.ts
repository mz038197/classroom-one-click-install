import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EnvironmentLaneService,
  type EnvironmentInstallDeps,
  type EnvironmentInstallResult,
  type ProbeRunner,
} from "../environmentLane";
import type { EnvironmentInstallPlan } from "../environmentInstallPlan";
import type { EnvironmentToolId } from "../toolProbe";
import type { ToolProbeInput } from "../toolProbe";

function selectOnly(
  lane: EnvironmentLaneService,
  id: EnvironmentToolId,
): void {
  for (const tool of lane.getView().tools) {
    if (tool.selected !== (tool.id === id)) {
      lane.toggleTool(tool.id);
    }
  }
}

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
    const result = await lane.installSelected();
    assert.equal(result, "cancelled");
    assert.equal(executed, false);
    assert.equal(lane.getView().tools.find((t) => t.id === "uv")?.status, "missing");
  });

  it("marks needs-reopen-terminal after install completes, not ready", async () => {
    const lane = new EnvironmentLaneService(alwaysMissingProbe(), makeDeps());
    await lane.recheck();
    const result = await lane.installSelected();
    assert.equal(result, "ran");
    const uv = lane.getView().tools.find((t) => t.id === "uv");
    assert.equal(uv?.status, "needs-reopen-terminal");
    assert.match(uv?.detail ?? "", /重開終端/);
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
    selectOnly(lane, "uv");
    await lane.installSelected();
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
    selectOnly(lane, "git");
    const result = await lane.installSelected();
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
    selectOnly(lane, "git");
    await lane.installSelected();
    assert.equal(seenPlan?.kind, "shell");
    assert.match(seenPlan?.commandOrUrl ?? "", /winget install --id Git\.Git/);
  });

  it("uses nvm shell plan for Node on macOS", async () => {
    let seenPlan: EnvironmentInstallPlan | undefined;
    const lane = new EnvironmentLaneService(
      alwaysMissingProbe(),
      makeDeps({
        platform: "darwin",
        execute: async (plan) => {
          seenPlan = plan;
          return { ok: true };
        },
      }),
    );
    await lane.recheck();
    selectOnly(lane, "node");
    await lane.installSelected();
    assert.equal(seenPlan?.kind, "shell");
    assert.match(seenPlan?.commandOrUrl ?? "", /nvm install --lts/);
    assert.doesNotMatch(seenPlan?.commandOrUrl ?? "", /nodejs\.org/);
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
    selectOnly(lane, "git");
    await lane.installSelected();
    assert.equal(seenPlan?.kind, "open-url");
    assert.match(seenPlan?.commandOrUrl ?? "", /git-scm\.com/);
  });

  it("marks PowerShell 7 needs-reopen-terminal after a successful install, not ready", async () => {
    const lane = new EnvironmentLaneService(alwaysMissingProbe(), makeDeps());
    await lane.recheck();
    selectOnly(lane, "pwsh");
    const result = await lane.installSelected();
    assert.equal(result, "ran");
    const pwsh = lane.getView().tools.find((t) => t.id === "pwsh");
    assert.equal(pwsh?.status, "needs-reopen-terminal");
    assert.match(pwsh?.detail ?? "", /重開終端/);
  });

  it("uses winget for PowerShell 7 on Windows when available", async () => {
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
    selectOnly(lane, "pwsh");
    await lane.installSelected();
    assert.equal(seenPlan?.kind, "shell");
    assert.match(seenPlan?.commandOrUrl ?? "", /Microsoft\.PowerShell/);
    assert.match(seenPlan?.commandOrUrl ?? "", /--disable-interactivity/);
  });

  it("opens Learn macOS PowerShell page from a single-row install", async () => {
    let seenPlan: EnvironmentInstallPlan | undefined;
    const lane = new EnvironmentLaneService(
      alwaysMissingProbe(),
      makeDeps({
        platform: "darwin",
        execute: async (plan) => {
          seenPlan = plan;
          return { ok: true };
        },
      }),
    );
    await lane.recheck();
    selectOnly(lane, "pwsh");
    await lane.installSelected();
    assert.equal(seenPlan?.kind, "open-url");
    assert.match(seenPlan?.commandOrUrl ?? "", /install-powershell-on-macos/);
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

    selectOnly(lane, "uv");
    await lane.installSelected();
    assert.ok(seenPlan);
    assert.equal(seenPlan?.tool, "uv");
    assert.equal(
      lane.getView().tools.find((t) => t.id === "uv")?.status,
      "needs-reopen-terminal",
    );
  });

  it("does not confirm or execute when nothing is selected", async () => {
    let confirmed = false;
    let executed = false;
    const lane = new EnvironmentLaneService(
      alwaysMissingProbe(),
      makeDeps({
        confirm: async () => {
          confirmed = true;
          return true;
        },
        execute: async () => {
          executed = true;
          return { ok: true };
        },
      }),
    );
    await lane.recheck();
    for (const tool of lane.getView().tools) {
      if (tool.selected) {
        lane.toggleTool(tool.id);
      }
    }
    assert.equal(lane.getView().canInstallSelected, false);
    const result = await lane.installSelected();
    assert.equal(result, "empty");
    assert.equal(confirmed, false);
    assert.equal(executed, false);
  });

  it("asks once then runs selected tools in fixed order and stops on failure", async () => {
    const executed: string[] = [];
    let confirmCount = 0;
    const lane = new EnvironmentLaneService(
      alwaysMissingProbe(),
      makeDeps({
        confirm: async (title) => {
          confirmCount += 1;
          assert.equal(title, "安裝所選環境工具");
          return true;
        },
        execute: async (plan) => {
          executed.push(plan.tool);
          if (plan.tool === "git") {
            return { ok: false, detail: "Access denied by MDM" };
          }
          return { ok: true };
        },
      }),
    );
    await lane.recheck();
    const result = await lane.installSelected();
    assert.equal(result, "failed");
    assert.equal(confirmCount, 1);
    assert.deepEqual(executed, ["uv", "git"]);
    const view = lane.getView();
    assert.equal(view.tools.find((t) => t.id === "uv")?.status, "needs-reopen-terminal");
    assert.equal(view.tools.find((t) => t.id === "uv")?.selected, false);
    assert.equal(view.tools.find((t) => t.id === "git")?.status, "failed");
    assert.equal(
      lane.getLastFailureDetail()?.includes("Access denied by MDM"),
      true,
    );
    assert.equal(view.tools.find((t) => t.id === "git")?.selected, true);
    assert.equal(view.tools.find((t) => t.id === "node")?.status, "missing");
    assert.equal(view.tools.find((t) => t.id === "node")?.selected, true);
    assert.equal(view.tools.find((t) => t.id === "pwsh")?.status, "missing");
    assert.notEqual(view.tools.find((t) => t.id === "uv")?.status, "ready");
  });

  it("shows installing only on the tool currently executing", async () => {
    const lane = new EnvironmentLaneService(
      alwaysMissingProbe(),
      makeDeps({
        execute: async (plan) => {
          const installing = lane
            .getView()
            .tools.filter((t) => t.status === "installing");
          assert.equal(installing.length, 1);
          assert.equal(installing[0]?.id, plan.tool);
          return { ok: true };
        },
      }),
    );
    await lane.recheck();
    await lane.installSelected();
    assert.ok(lane.getView().tools.every((t) => t.status !== "installing"));
    assert.equal(lane.getView().selectionLocked, false);
  });

  it("ignores toggle and a second install while a batch is running", async () => {
    let nested: "cancelled" | "ran" | "failed" | "unavailable" | "empty" | "busy" | undefined;
    let gitSelectedDuring = true;
    const lane = new EnvironmentLaneService(
      alwaysMissingProbe(),
      makeDeps({
        execute: async (plan) => {
          if (plan.tool === "uv") {
            nested = await lane.installSelected();
            lane.toggleTool("git");
            gitSelectedDuring = lane.getView().tools.find((t) => t.id === "git")?.selected ?? false;
          }
          return { ok: true };
        },
      }),
    );
    await lane.recheck();
    await lane.installSelected();
    assert.equal(nested, "busy");
    assert.equal(gitSelectedDuring, true);
    assert.equal(lane.getView().selectionLocked, false);
  });

  it("locks selection before confirm so a second install is ignored", async () => {
    let nested: EnvironmentInstallResult | undefined;
    const lane = new EnvironmentLaneService(
      alwaysMissingProbe(),
      makeDeps({
        confirm: async () => {
          nested = await lane.installSelected();
          lane.toggleTool("uv");
          return false;
        },
      }),
    );
    await lane.recheck();
    const before = lane.getView().tools.map((t) => t.selected);
    const result = await lane.installSelected();
    assert.equal(nested, "busy");
    assert.equal(result, "cancelled");
    assert.deepEqual(
      lane.getView().tools.map((t) => t.selected),
      before,
    );
    assert.equal(lane.getView().selectionLocked, false);
  });

  it("keeps checkboxes unchanged when the student cancels confirm", async () => {
    const lane = new EnvironmentLaneService(
      alwaysMissingProbe(),
      makeDeps({ confirm: async () => false }),
    );
    await lane.recheck();
    lane.toggleTool("pwsh");
    const before = lane.getView().tools.map((t) => t.selected);
    await lane.installSelected();
    assert.deepEqual(
      lane.getView().tools.map((t) => t.selected),
      before,
    );
  });
});
