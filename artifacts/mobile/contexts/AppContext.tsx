import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { generateId } from "@/lib/ids";
import { DEFAULT_MODEL_ID, GROQ_MODELS, getModelById } from "@/lib/models";
import {
  STORAGE_KEYS,
  loadConversations,
  loadString,
  removeKey,
  saveConversations,
  saveString,
} from "@/lib/storage";

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  modelId?: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  modelId: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface AppContextValue {
  ready: boolean;

  apiKey: string | null;
  setApiKey: (key: string) => Promise<void>;
  clearApiKey: () => Promise<void>;

  defaultModelId: string;
  setDefaultModelId: (id: string) => Promise<void>;

  conversations: Conversation[];
  currentConversationId: string | null;
  currentConversation: Conversation | null;

  selectConversation: (id: string) => void;
  newConversation: (modelId?: string) => string;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  clearAllConversations: () => void;

  setConversationModel: (id: string, modelId: string) => void;
  appendMessage: (conversationId: string, message: ChatMessage) => void;
  updateLastAssistantMessage: (
    conversationId: string,
    updater: (msg: ChatMessage) => ChatMessage,
  ) => void;
  removeMessage: (conversationId: string, messageId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function generateTitleFromMessage(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, " ");
  if (!trimmed) return "New Chat";
  return trimmed.length > 40 ? `${trimmed.slice(0, 40).trim()}…` : trimmed;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [defaultModelId, setDefaultModelIdState] =
    useState<string>(DEFAULT_MODEL_ID);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);

  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  // Hydrate from storage once
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [storedKey, storedModel, storedConvos, storedCurrent] =
        await Promise.all([
          loadString(STORAGE_KEYS.apiKey),
          loadString(STORAGE_KEYS.defaultModel),
          loadConversations(),
          loadString(STORAGE_KEYS.currentConversationId),
        ]);

      if (!mounted) return;

      setApiKeyState(storedKey);
      const validIds = new Set(GROQ_MODELS.map((m) => m.id));
      const safeDefault =
        storedModel && validIds.has(storedModel) ? storedModel : DEFAULT_MODEL_ID;
      setDefaultModelIdState(safeDefault);

      // Migrate any conversations using deprecated/removed models
      const migrated = storedConvos.map((c) =>
        validIds.has(c.modelId) ? c : { ...c, modelId: safeDefault },
      );
      setConversations(migrated);

      if (storedCurrent && storedConvos.some((c) => c.id === storedCurrent)) {
        setCurrentConversationId(storedCurrent);
      } else if (storedConvos.length > 0 && storedConvos[0]) {
        setCurrentConversationId(storedConvos[0].id);
      }

      setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Persist conversations when they change (after ready)
  useEffect(() => {
    if (!ready) return;
    void saveConversations(conversations);
  }, [conversations, ready]);

  useEffect(() => {
    if (!ready) return;
    if (currentConversationId) {
      void saveString(STORAGE_KEYS.currentConversationId, currentConversationId);
    } else {
      void removeKey(STORAGE_KEYS.currentConversationId);
    }
  }, [currentConversationId, ready]);

  const setApiKey = useCallback(async (key: string) => {
    setApiKeyState(key);
    await saveString(STORAGE_KEYS.apiKey, key);
  }, []);

  const clearApiKey = useCallback(async () => {
    setApiKeyState(null);
    await removeKey(STORAGE_KEYS.apiKey);
  }, []);

  const setDefaultModelId = useCallback(
    async (id: string) => {
      setDefaultModelIdState(id);
      await saveString(STORAGE_KEYS.defaultModel, id);
      // Also apply to the active conversation so the change is immediate
      const activeId = currentConversationId;
      if (activeId) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId ? { ...c, modelId: id, updatedAt: Date.now() } : c,
          ),
        );
      }
    },
    [currentConversationId],
  );

  const newConversation = useCallback(
    (modelId?: string) => {
      const id = generateId("conv");
      const now = Date.now();
      const conversation: Conversation = {
        id,
        title: "New Chat",
        modelId: modelId ?? defaultModelId,
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
      setConversations((prev) => [conversation, ...prev]);
      setCurrentConversationId(id);
      return id;
    },
    [defaultModelId],
  );

  const selectConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      setCurrentConversationId((current) => {
        if (current !== id) return current;
        return filtered[0]?.id ?? null;
      });
      return filtered;
    });
  }, []);

  const renameConversation = useCallback((id: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, title, updatedAt: Date.now() } : c,
      ),
    );
  }, []);

  const clearAllConversations = useCallback(() => {
    setConversations([]);
    setCurrentConversationId(null);
  }, []);

  const setConversationModel = useCallback(
    (id: string, modelId: string) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, modelId, updatedAt: Date.now() } : c,
        ),
      );
    },
    [],
  );

  const appendMessage = useCallback(
    (conversationId: string, message: ChatMessage) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;
          const isFirstUserMessage =
            c.messages.length === 0 && message.role === "user";
          return {
            ...c,
            title: isFirstUserMessage
              ? generateTitleFromMessage(message.content)
              : c.title,
            messages: [...c.messages, message],
            updatedAt: Date.now(),
          };
        }),
      );
    },
    [],
  );

  const updateLastAssistantMessage = useCallback(
    (
      conversationId: string,
      updater: (msg: ChatMessage) => ChatMessage,
    ) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;
          const next = [...c.messages];
          for (let i = next.length - 1; i >= 0; i--) {
            const candidate = next[i];
            if (candidate && candidate.role === "assistant") {
              next[i] = updater(candidate);
              break;
            }
          }
          return { ...c, messages: next, updatedAt: Date.now() };
        }),
      );
    },
    [],
  );

  const removeMessage = useCallback(
    (conversationId: string, messageId: string) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: c.messages.filter((m) => m.id !== messageId),
                updatedAt: Date.now(),
              }
            : c,
        ),
      );
    },
    [],
  );

  const currentConversation = useMemo(
    () => conversations.find((c) => c.id === currentConversationId) ?? null,
    [conversations, currentConversationId],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      apiKey,
      setApiKey,
      clearApiKey,
      defaultModelId,
      setDefaultModelId,
      conversations,
      currentConversationId,
      currentConversation,
      selectConversation,
      newConversation,
      deleteConversation,
      renameConversation,
      clearAllConversations,
      setConversationModel,
      appendMessage,
      updateLastAssistantMessage,
      removeMessage,
    }),
    [
      ready,
      apiKey,
      setApiKey,
      clearApiKey,
      defaultModelId,
      setDefaultModelId,
      conversations,
      currentConversationId,
      currentConversation,
      selectConversation,
      newConversation,
      deleteConversation,
      renameConversation,
      clearAllConversations,
      setConversationModel,
      appendMessage,
      updateLastAssistantMessage,
      removeMessage,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export { getModelById };
