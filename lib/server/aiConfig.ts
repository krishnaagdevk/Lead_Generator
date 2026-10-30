export interface AIModelMeta {
  id: string;
  name: string;
  provider: "NaraRouter" | "Groq" | "Custom";
  isDefault?: boolean;
}

const MODEL_FRIENDLY_NAMES: Record<string, string> = {
  "laguna-s-2.1": "Laguna S-2.1 (Fast & Smart)",
  "openai/gpt-oss-120b": "GPT OSS 120B (Enterprise Intelligence)",
  "openai/gpt-oss-20b": "GPT OSS 20B (Instant Speed)",
  "qwen/qwen3.8-27b": "Qwen 3.8 27B (High Performance)",
};

const LEGACY_ALIASES: Record<string, string> = {
  "mistral-large": "laguna-s-2.1",
  "mimo-v2.5-free": "laguna-s-2.1",
  "mistral-medium-3-5": "laguna-s-2.1",
  "tencent-hy3": "laguna-s-2.1",
  "llama-3.3-70b-versatile": "openai/gpt-oss-120b",
  "llama-3.1-8b-instant": "openai/gpt-oss-20b",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free": "laguna-s-2.1",
};

export function getAvailableAIModels(): { defaultModel: string; models: AIModelMeta[] } {
  const defaultModel = process.env.DEFAULT_AI_MODEL || "laguna-s-2.1";

  const naraModelsList = (process.env.NARA_MODELS || "laguna-s-2.1")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  const groqModelsList = (process.env.GROQ_MODELS || "openai/gpt-oss-120b,openai/gpt-oss-20b,qwen/qwen3.8-27b")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  const customModelsList = (process.env.CUSTOM_AI_MODELS || "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  const models: AIModelMeta[] = [];

  // NaraRouter models
  for (const id of naraModelsList) {
    models.push({
      id,
      name: MODEL_FRIENDLY_NAMES[id] || id,
      provider: "NaraRouter",
      isDefault: id === defaultModel,
    });
  }

  // Groq models
  for (const id of groqModelsList) {
    models.push({
      id,
      name: MODEL_FRIENDLY_NAMES[id] || id,
      provider: "Groq",
      isDefault: id === defaultModel,
    });
  }

  // Custom models (if configured in env)
  for (const id of customModelsList) {
    models.push({
      id,
      name: MODEL_FRIENDLY_NAMES[id] || id,
      provider: "Custom",
      isDefault: id === defaultModel,
    });
  }

  return { defaultModel, models };
}

export function resolveAIModel(requestedModel?: string): {
  targetModel: string;
  provider: "NaraRouter" | "Groq" | "Custom";
  fallbackModel: string;
  fallbackProvider: "NaraRouter" | "Groq" | "Custom";
} {
  const { defaultModel, models } = getAvailableAIModels();
  
  // Resolve legacy aliases if an older model string is passed
  let resolvedId = requestedModel ? (LEGACY_ALIASES[requestedModel] || requestedModel) : defaultModel;

  const matched = models.find((m) => m.id === resolvedId);
  const primaryProvider = matched?.provider || (resolvedId.includes("/") ? "Groq" : "NaraRouter");

  // Determine fallback: If primary is NaraRouter, fallback to Groq, and vice versa
  const fallbackModel = primaryProvider === "NaraRouter" ? "openai/gpt-oss-120b" : "laguna-s-2.1";
  const fallbackProvider = primaryProvider === "NaraRouter" ? "Groq" : "NaraRouter";

  return {
    targetModel: resolvedId,
    provider: primaryProvider,
    fallbackModel,
    fallbackProvider,
  };
}

