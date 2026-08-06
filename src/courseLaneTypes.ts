import type { ActionRunSnapshot } from "./actionRunState";
import type { InstallAction } from "./courseCatalog";

export const CATALOG_FILENAME = "classroom-installs.yaml";

export type CourseLaneActionView = InstallAction & {
  run: ActionRunSnapshot;
  disabledReason?: string;
};

export type CourseLaneView =
  | { kind: "no-workspace" }
  | {
      kind: "missing";
      message: string;
      tip?: string;
      canRetryRemote?: boolean;
    }
  | {
      kind: "invalid";
      message: string;
      tip?: string;
      canRetryRemote?: boolean;
    }
  | {
      kind: "ready";
      workspaceRoot: string;
      actions: CourseLaneActionView[];
      tip?: string;
      canRetryRemote?: boolean;
      source?: "session" | "workspace";
    };
