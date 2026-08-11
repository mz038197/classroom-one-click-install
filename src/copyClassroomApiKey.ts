import { isPlainClassroomApiKey } from "./hostLmSecret";

export type CopyClassroomApiKeyResult = { ok: true } | { ok: false };

/** Copy Classroom API Key from secret storage to the system clipboard. Never returns the key. */
export async function copyClassroomApiKey(options: {
  getSecret: (key: string) => Thenable<string | undefined>;
  writeClipboard: (text: string) => Thenable<void>;
  apiKeySecretKey?: string;
}): Promise<CopyClassroomApiKeyResult> {
  const secretKey = options.apiKeySecretKey ?? "classroomApiKey";
  const key = await options.getSecret(secretKey);
  if (typeof key !== "string" || !isPlainClassroomApiKey(key)) {
    return { ok: false };
  }
  await options.writeClipboard(key);
  return { ok: true };
}
