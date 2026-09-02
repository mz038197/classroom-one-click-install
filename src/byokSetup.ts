/**
 * BYOK Setup: merge router model template into chatLanguageModels.json and write Classroom API Key.
 */

export type ChatLanguageModelProvider = {
  name?: string;
  vendor?: string;
  apiKey?: string;
  models?: unknown[];
  [key: string]: unknown;
};

const MODEL_PATCH_KEYS = [
  "requestHeaders",
  "thinking",
  "reasoningEffortFormat",
  "supportsReasoningEffort",
  "zeroDataRetentionEnabled",
  "toolCalling",
  "vision",
  "maxInputTokens",
  "maxOutputTokens",
  "apiType",
  "url",
] as const;

function providerKey(provider: ChatLanguageModelProvider): string {
  return `${provider.vendor ?? ""}\0${provider.name ?? ""}`;
}

function isClassroomProvider(provider: ChatLanguageModelProvider): boolean {
  return provider.name === "VCRouter" && provider.vendor === "customendpoint";
}

function patchModelFromTemplate(
  existing: Record<string, unknown>,
  template: Record<string, unknown>,
): void {
  for (const key of MODEL_PATCH_KEYS) {
    if (!(key in existing) && key in template) {
      existing[key] = template[key];
    }
  }
}

export function mergeChatLanguageModels(
  existing: ChatLanguageModelProvider[] | null | undefined,
  template: ChatLanguageModelProvider[],
): ChatLanguageModelProvider[] {
  const merged: ChatLanguageModelProvider[] = structuredClone(existing ?? []);
  const index = new Map<string, ChatLanguageModelProvider>();
  for (const provider of merged) {
    if (provider && typeof provider === "object") {
      index.set(providerKey(provider), provider);
    }
  }

  for (const templateProvider of template) {
    if (!templateProvider || typeof templateProvider !== "object") {
      continue;
    }
    const key = providerKey(templateProvider);
    const found = index.get(key);
    if (!found) {
      const copy = structuredClone(templateProvider);
      merged.push(copy);
      index.set(key, copy);
      continue;
    }

    let existingModels = found.models;
    if (!Array.isArray(existingModels)) {
      existingModels = [];
      found.models = existingModels;
    }

    const modelIds = new Set(
      existingModels
        .filter((m): m is Record<string, unknown> => !!m && typeof m === "object")
        .map((m) => m.id)
        .filter((id): id is string => typeof id === "string" && !!id),
    );

    const templateModels = templateProvider.models;
    if (!Array.isArray(templateModels)) {
      continue;
    }
    const allowedIds = new Set(
      templateModels
        .filter((m): m is Record<string, unknown> => !!m && typeof m === "object")
        .map((m) => m.id)
        .filter((id): id is string => typeof id === "string" && !!id),
    );
    for (const templateModel of templateModels) {
      if (!templateModel || typeof templateModel !== "object") {
        continue;
      }
      const model = templateModel as Record<string, unknown>;
      const modelId = typeof model.id === "string" ? model.id : undefined;
      if (modelId && modelIds.has(modelId)) {
        for (const existingModel of existingModels) {
          if (
            existingModel &&
            typeof existingModel === "object" &&
            (existingModel as Record<string, unknown>).id === modelId
          ) {
            patchModelFromTemplate(existingModel as Record<string, unknown>, model);
            break;
          }
        }
        continue;
      }
      existingModels.push(structuredClone(model));
      if (modelId) {
        modelIds.add(modelId);
      }
    }
    found.models = existingModels.filter((existingModel) => {
      if (!existingModel || typeof existingModel !== "object") {
        return false;
      }
      const id = (existingModel as Record<string, unknown>).id;
      return typeof id === "string" && allowedIds.has(id);
    });
  }

  if (!template.some((provider) => isClassroomProvider(provider))) {
    for (const provider of merged) {
      if (isClassroomProvider(provider)) {
        provider.models = [];
      }
    }
  }

  return merged;
}

/** Set apiKey on every provider that appears in the template (by vendor+name). */
export function applyApiKeyToTemplate(
  providers: ChatLanguageModelProvider[],
  apiKey: string,
  template?: ChatLanguageModelProvider[],
): ChatLanguageModelProvider[] {
  const keys = new Set(
    (template ?? providers).map((p) => providerKey(p)),
  );
  return providers.map((provider) => {
    if (keys.has(providerKey(provider)) || isClassroomProvider(provider)) {
      return { ...provider, apiKey };
    }
    return provider;
  });
}

/** VCRouter model ids, for Allowlist sync diffs. */
export function classroomModelSignature(
  providers: ChatLanguageModelProvider[] | null | undefined,
): string {
  const ids: string[] = [];
  for (const provider of providers ?? []) {
    if (!provider || typeof provider !== "object") {
      continue;
    }
    if (!isClassroomProvider(provider) || !Array.isArray(provider.models)) {
      continue;
    }
    for (const model of provider.models) {
      if (!model || typeof model !== "object") {
        continue;
      }
      const id = (model as Record<string, unknown>).id;
      if (typeof id === "string" && id) {
        ids.push(`${providerKey(provider)}\0${id}`);
      }
    }
  }
  return ids.sort().join("\n");
}

export function mergeByokConfig(
  existing: ChatLanguageModelProvider[] | null | undefined,
  template: ChatLanguageModelProvider[],
  apiKey: string,
): ChatLanguageModelProvider[] {
  const merged = mergeChatLanguageModels(existing, template);
  return applyApiKeyToTemplate(merged, apiKey, template);
}
