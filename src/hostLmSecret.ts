import type { ChatLanguageModelProvider } from "./byokSetup";

/** Stable Host secret key for Classroom API Key (VS Code Language Models). */
export const CLASSROOM_CHAT_LM_SECRET_KEY = "chat.lm.secret.vans-classroom";

export function toChatLmSecretInputRef(secretKey: string): string {
  return `\${input:${secretKey}}`;
}

export function isChatLmSecretInputRef(value: string | undefined): boolean {
  return typeof value === "string" && value.startsWith("${input:chat.lm.secret.");
}

export function isPlainClassroomApiKey(value: string | undefined): boolean {
  return typeof value === "string" && value.startsWith("vcr_sk_");
}

export function applyHostSecretRefToProviders(
  providers: ChatLanguageModelProvider[],
  match: { name: string; vendor: string },
  apiKeyRef: string,
): ChatLanguageModelProvider[] {
  return providers.map((provider) => {
    if (provider.name === match.name && provider.vendor === match.vendor) {
      return { ...provider, apiKey: apiKeyRef };
    }
    return provider;
  });
}
