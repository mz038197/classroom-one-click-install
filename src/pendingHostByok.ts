import { isPlainClassroomApiKey } from "./hostLmSecret";
import {
  ensureHostChatLmSecret,
  hostStateDbPath,
} from "./hostStateDb";

export const PENDING_HOST_BYOK_STATE_KEY = "pendingHostByok";

export type PendingHostByok = {
  extensionId: string;
  userDir: string;
};

/**
 * Re-write Host chat.lm.secret after a full VS Code restart.
 * Writing only during an active session is racy: Reload/flush may drop DB-only rows.
 */
export async function finalizePendingHostByok(options: {
  pending: PendingHostByok | undefined;
  getApiKey: () => Promise<string | undefined>;
  clearPending: () => void | Promise<void>;
  ensureHost?: typeof ensureHostChatLmSecret;
}): Promise<"wrote" | "skipped" | "failed"> {
  if (!options.pending) {
    return "skipped";
  }
  const apiKey = await options.getApiKey();
  if (!isPlainClassroomApiKey(apiKey)) {
    await options.clearPending();
    return "skipped";
  }
  try {
    const ensure = options.ensureHost ?? ensureHostChatLmSecret;
    await ensure({
      stateDbPath: hostStateDbPath(options.pending.userDir),
      extensionId: options.pending.extensionId,
      plaintext: apiKey!,
    });
    await options.clearPending();
    return "wrote";
  } catch {
    return "failed";
  }
}
