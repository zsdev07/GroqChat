export interface GroqModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  badge?: string;
}

export const GROQ_MODELS: GroqModel[] = [
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    description: "Versatile, high-quality reasoning",
    contextWindow: 128000,
    badge: "Default",
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B",
    description: "Lightning fast responses",
    contextWindow: 128000,
    badge: "Fastest",
  },
  {
    id: "openai/gpt-oss-120b",
    name: "GPT-OSS 120B",
    description: "OpenAI open-weight flagship model",
    contextWindow: 128000,
    badge: "Powerful",
  },
  {
    id: "openai/gpt-oss-20b",
    name: "GPT-OSS 20B",
    description: "OpenAI open-weight balanced model",
    contextWindow: 128000,
  },
];

export const DEFAULT_MODEL_ID = "llama-3.3-70b-versatile";

export function getModelById(id: string): GroqModel {
  return GROQ_MODELS.find((m) => m.id === id) ?? GROQ_MODELS[0]!;
}
