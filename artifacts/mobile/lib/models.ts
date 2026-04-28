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
    id: "deepseek-r1-distill-llama-70b",
    name: "DeepSeek R1 70B",
    description: "Step-by-step reasoning model",
    contextWindow: 128000,
    badge: "Reasoning",
  },
  {
    id: "qwen-2.5-32b",
    name: "Qwen 2.5 32B",
    description: "Strong multilingual capabilities",
    contextWindow: 128000,
  },
  {
    id: "qwen-2.5-coder-32b",
    name: "Qwen 2.5 Coder 32B",
    description: "Specialised for code generation",
    contextWindow: 128000,
    badge: "Code",
  },
  {
    id: "gemma2-9b-it",
    name: "Gemma 2 9B",
    description: "Compact instruction-tuned model",
    contextWindow: 8192,
  },
  {
    id: "llama-3.2-90b-vision-preview",
    name: "Llama 3.2 90B Vision",
    description: "Multimodal vision-language model",
    contextWindow: 8192,
    badge: "Vision",
  },
];

export const DEFAULT_MODEL_ID = "llama-3.3-70b-versatile";

export function getModelById(id: string): GroqModel {
  return GROQ_MODELS.find((m) => m.id === id) ?? GROQ_MODELS[0]!;
}
