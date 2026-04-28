import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Conversation } from "@/contexts/AppContext";

export const STORAGE_KEYS = {
  apiKey: "groqchat:apiKey",
  conversations: "groqchat:conversations",
  currentConversationId: "groqchat:currentConversationId",
  defaultModel: "groqchat:defaultModel",
  tokenStatsEnabled: "groqchat:tokenStatsEnabled",
} as const;

export async function loadString(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function saveString(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export async function loadConversations(): Promise<Conversation[]> {
  const raw = await loadString(STORAGE_KEYS.conversations);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Conversation[];
  } catch {
    // ignore
  }
  return [];
}

export async function saveConversations(
  conversations: Conversation[],
): Promise<void> {
  await saveString(STORAGE_KEYS.conversations, JSON.stringify(conversations));
}
