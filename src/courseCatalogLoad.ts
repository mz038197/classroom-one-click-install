import { parseCourseCatalog, type InstallAction } from "./courseCatalog";
import { CATALOG_FILENAME } from "./courseLaneTypes";

export const FALLBACK_TIP =
  "遠端清單不可用，已改用專案內 YAML。可按「再試遠端」重新拉取。";

export type CourseCatalogLoadResult =
  | {
      ok: true;
      source: "session" | "workspace";
      actions: InstallAction[];
      tip?: string;
      canRetryRemote: boolean;
    }
  | {
      ok: false;
      kind: "missing" | "invalid";
      message: string;
      tip?: string;
      canRetryRemote: boolean;
    };

export type CourseCatalogLoadDeps = {
  apiKey: string | undefined;
  fetchRemoteYaml: (apiKey: string) => Promise<string>;
  readWorkspaceYaml: () => Promise<string | undefined>;
};

/** Session Catalog 優先；擴充手上沒有可用 YAML 時 fallback 工作區檔。 */
export async function loadCourseCatalog(
  deps: CourseCatalogLoadDeps,
): Promise<CourseCatalogLoadResult> {
  const key = deps.apiKey?.trim();
  if (key) {
    try {
      const yamlText = await deps.fetchRemoteYaml(key);
      const parsed = parseCourseCatalog(yamlText);
      if (parsed.ok) {
        return {
          ok: true,
          source: "session",
          actions: parsed.actions,
          canRetryRemote: true,
        };
      }
    } catch {
      // fall through to workspace
    }
  }

  const local = await deps.readWorkspaceYaml();
  const canRetryRemote = Boolean(key);
  if (local === undefined) {
    return {
      ok: false,
      kind: "missing",
      message: `找不到 ${CATALOG_FILENAME}`,
      ...(canRetryRemote ? { tip: FALLBACK_TIP } : {}),
      canRetryRemote,
    };
  }
  const parsed = parseCourseCatalog(local);
  if (!parsed.ok) {
    return {
      ok: false,
      kind: "invalid",
      message: parsed.error,
      ...(canRetryRemote ? { tip: FALLBACK_TIP } : {}),
      canRetryRemote,
    };
  }
  return {
    ok: true,
    source: "workspace",
    actions: parsed.actions,
    ...(canRetryRemote ? { tip: FALLBACK_TIP } : {}),
    canRetryRemote,
  };
}
