import { fetch } from "expo/fetch";

import type { ChatMessage } from "@/contexts/AppContext";
import { buildAttachmentBlock } from "@/lib/fileExtractor";

function expandAttachment(msg: ChatMessage): string {
  if (!msg.attachment) return msg.content;
  const block = buildAttachmentBlock({
    name: msg.attachment.name,
    language: msg.attachment.language,
    lineCount: msg.attachment.lineCount,
    tokenEstimate: msg.attachment.tokenEstimate,
    content: msg.attachment.content,
    size: msg.attachment.content.length,
  });
  if (!msg.content) return block;
  return `${block}\n\n${msg.content}`;
}

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export interface GroqUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface StreamArgs {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
  onChunk: (chunk: string) => void;
  onUsage?: (usage: GroqUsage) => void;
}

export async function streamGroq({
  apiKey,
  model,
  messages,
  signal,
  onChunk,
  onUsage,
}: StreamArgs): Promise<void> {
  const payload = {
    model,
    stream: true,
    stream_options: { include_usage: true },
    messages: messages
      .filter((m) => m.role !== "system" || m.content || m.attachment)
      .map((m) => ({ role: m.role, content: expandAttachment(m) })),
  };

  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      Accept: "text/event-stream",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let message = `Groq request failed (${response.status})`;
    try {
      const parsed = JSON.parse(text);
      if (parsed?.error?.message) message = parsed.error.message;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body from Groq");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data) continue;
      if (data === "[DONE]") return;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed?.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta.length > 0) {
          onChunk(delta);
        }
        if (parsed?.usage && onUsage) {
          onUsage(parsed.usage as GroqUsage);
        }
      } catch {
        // ignore malformed chunks
      }
    }
  }
}

export async function validateGroqKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}
