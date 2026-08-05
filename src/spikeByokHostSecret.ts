import fs from "node:fs/promises";
import type { ChatLanguageModelProvider } from "./byokSetup";
import {
  CLASSROOM_CHAT_LM_SECRET_KEY,
  applyHostSecretRefToProviders,
  isPlainClassroomApiKey,
  toChatLmSecretInputRef,
} from "./hostLmSecret";

export type SpikeByokHostSecretResult = {
  modelsPath: string;
  secretKey: string;
  apiKeyRef: string;
  hostStorageKey: string;
};

/**
 * Spike (path A): write Classroom API Key into extension SecretStorage, promote the
 * encrypted blob to Host `secret://chat.lm.secret.*` (what Copilot resolves), and
 * point VCRouter.apiKey at `${input:…}`.
 */
export async function spikeByokHostSecret(options: {
  modelsPath: string;
  match?: { name: string; vendor: string };
  getClassroomApiKey: () => Promise<string | undefined>;
  /** Optional: plaintext already under extension SecretStorage for chat.lm.secret.* */
  getExtensionChatLmSecret?: () => Promise<string | undefined>;
  storeSecret: (key: string, value: string) => Promise<void>;
  /** Copy/encrypt into Host workbench secret row; returns storage key written. */
  promoteToHost: () => Promise<{ hostStorageKey: string }>;
  readFile?: (path: string) => Promise<string>;
  writeFile?: (path: string, data: string) => Promise<void>;
}): Promise<SpikeByokHostSecretResult> {
  const match = options.match ?? { name: "VCRouter", vendor: "customendpoint" };
  const readFile = options.readFile ?? ((p) => fs.readFile(p, "utf8"));
  const writeFile = options.writeFile ?? ((p, d) => fs.writeFile(p, d, "utf8"));

  const raw = await readFile(options.modelsPath);
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("chatLanguageModels.json 必須是陣列");
  }
  const providers = parsed as ChatLanguageModelProvider[];
  const target = providers.find(
    (p) => p.name === match.name && p.vendor === match.vendor,
  );
  if (!target) {
    throw new Error(`找不到 ${match.vendor}/${match.name} provider`);
  }

  const fromStore = await options.getClassroomApiKey();
  const fromExtSecret = options.getExtensionChatLmSecret
    ? await options.getExtensionChatLmSecret()
    : undefined;
  const fromFile = typeof target.apiKey === "string" ? target.apiKey : undefined;
  const apiKey = [fromStore, fromExtSecret, fromFile].find(isPlainClassroomApiKey);
  if (!apiKey) {
    throw new Error(
      "找不到明文 Classroom API Key（擴充 SecretStorage 或檔內 vcr_sk_…）。請先跑完兌換。",
    );
  }

  const secretKey = CLASSROOM_CHAT_LM_SECRET_KEY;
  const apiKeyRef = toChatLmSecretInputRef(secretKey);
  await options.storeSecret(secretKey, apiKey);
  const { hostStorageKey } = await options.promoteToHost();

  const updated = applyHostSecretRefToProviders(providers, match, apiKeyRef);
  await writeFile(options.modelsPath, `${JSON.stringify(updated, null, 2)}\n`);

  return { modelsPath: options.modelsPath, secretKey, apiKeyRef, hostStorageKey };
}
