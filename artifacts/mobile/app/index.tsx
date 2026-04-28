import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ChatHeader from "@/components/ChatHeader";
import ChatInput, { type ChatInputHandle } from "@/components/ChatInput";
import EmptyChatState from "@/components/EmptyChatState";
import MessageRow from "@/components/ChatMessage";
import {
  type ChatMessage,
  getModelById,
  useApp,
} from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { streamGroq } from "@/lib/groq";
import { generateId } from "@/lib/ids";

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const inputRef = useRef<ChatInputHandle>(null);
  const abortRef = useRef<AbortController | null>(null);

  const {
    ready,
    apiKey,
    defaultModelId,
    currentConversation,
    newConversation,
    appendMessage,
    updateLastAssistantMessage,
    removeMessage,
    truncateMessagesAt,
    tokenStatsEnabled,
  } = useApp();

  const [isStreaming, setIsStreaming] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Ensure there is a conversation once hydrated
  useEffect(() => {
    if (ready && !currentConversation) {
      newConversation(defaultModelId);
    }
  }, [ready, currentConversation, newConversation, defaultModelId]);

  const conversationId = currentConversation?.id ?? null;
  const modelId = currentConversation?.modelId ?? defaultModelId;
  const messages = useMemo(
    () => currentConversation?.messages ?? [],
    [currentConversation?.messages],
  );

  // Index of last user message (used for "Edit" eligibility)
  const lastUserIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m && m.role === "user") return i;
    }
    return -1;
  }, [messages]);

  const runCompletion = useCallback(
    async (
      convId: string,
      historyForApi: ChatMessage[],
      assistantPlaceholder: ChatMessage,
    ) => {
      if (!apiKey) {
        router.push("/settings");
        return;
      }

      setErrorBanner(null);
      appendMessage(convId, assistantPlaceholder);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const startTime = Date.now();
      let accumulated = "";
      let lastUsage: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      } | null = null;
      try {
        await streamGroq({
          apiKey,
          model: assistantPlaceholder.modelId ?? modelId,
          messages: historyForApi,
          signal: controller.signal,
          onChunk: (chunk) => {
            accumulated += chunk;
            updateLastAssistantMessage(convId, (msg) => ({
              ...msg,
              content: accumulated,
            }));
          },
          onUsage: (usage) => {
            lastUsage = usage;
          },
        });

        if (accumulated.length === 0) {
          updateLastAssistantMessage(convId, (msg) => ({
            ...msg,
            content: "(No response from model)",
          }));
        }

        const duration = Date.now() - startTime;
        updateLastAssistantMessage(convId, (msg) => ({
          ...msg,
          stats: {
            promptTokens: lastUsage?.prompt_tokens,
            completionTokens: lastUsage?.completion_tokens,
            totalTokens: lastUsage?.total_tokens,
            durationMs: duration,
          },
        }));

        if (Platform.OS !== "web") {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          if (accumulated.length === 0) {
            removeMessage(convId, assistantPlaceholder.id);
          } else {
            const duration = Date.now() - startTime;
            updateLastAssistantMessage(convId, (msg) => ({
              ...msg,
              content: `${msg.content}\n\n_(stopped)_`,
              stats: {
                promptTokens: lastUsage?.prompt_tokens,
                completionTokens: lastUsage?.completion_tokens,
                totalTokens: lastUsage?.total_tokens,
                durationMs: duration,
              },
            }));
          }
        } else {
          const message =
            err instanceof Error ? err.message : "Something went wrong";
          removeMessage(convId, assistantPlaceholder.id);
          setErrorBanner(message);
          if (Platform.OS !== "web") {
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Error,
            );
          }
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [
      apiKey,
      appendMessage,
      modelId,
      removeMessage,
      router,
      updateLastAssistantMessage,
    ],
  );

  const handleSend = useCallback(
    async (text: string) => {
      if (!conversationId) return;
      if (!apiKey) {
        router.push("/settings");
        return;
      }

      const userMessage: ChatMessage = {
        id: generateId("msg"),
        role: "user",
        content: text,
        createdAt: Date.now(),
      };
      const assistantMessage: ChatMessage = {
        id: generateId("msg"),
        role: "assistant",
        content: "",
        modelId,
        createdAt: Date.now(),
      };

      appendMessage(conversationId, userMessage);
      const history: ChatMessage[] = [...messages, userMessage];
      await runCompletion(conversationId, history, assistantMessage);
    },
    [
      conversationId,
      apiKey,
      modelId,
      messages,
      appendMessage,
      router,
      runCompletion,
    ],
  );

  const handleEditUserMessage = useCallback(
    (msg: ChatMessage) => {
      if (!conversationId) return;
      if (isStreaming) {
        abortRef.current?.abort();
      }
      const idx = messages.findIndex((m) => m.id === msg.id);
      if (idx === -1) return;
      // Drop this user message and everything after it, then re-fill the input
      truncateMessagesAt(conversationId, idx);
      inputRef.current?.setText(msg.content);
    },
    [conversationId, isStreaming, messages, truncateMessagesAt],
  );

  const handleRetryAssistant = useCallback(
    async (msg: ChatMessage) => {
      if (!conversationId) return;
      if (isStreaming) return;

      const idx = messages.findIndex((m) => m.id === msg.id);
      if (idx === -1) return;

      // The history we'll resend = everything before this assistant message
      const historyForApi = messages.slice(0, idx);
      // Find the most recent user message to retry against
      const hasUserBefore = historyForApi.some((m) => m.role === "user");
      if (!hasUserBefore) return;

      // Drop this assistant message (and anything after, just in case)
      truncateMessagesAt(conversationId, idx);

      const assistantMessage: ChatMessage = {
        id: generateId("msg"),
        role: "assistant",
        content: "",
        modelId,
        createdAt: Date.now(),
      };

      await runCompletion(conversationId, historyForApi, assistantMessage);
    },
    [
      conversationId,
      isStreaming,
      messages,
      modelId,
      runCompletion,
      truncateMessagesAt,
    ],
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handlePickModel = useCallback(() => {
    router.push("/model-picker");
  }, [router]);

  const handleOpenHistory = useCallback(() => {
    router.push("/history");
  }, [router]);

  const handleOpenSettings = useCallback(() => {
    router.push("/settings");
  }, [router]);

  const handleNewChat = useCallback(() => {
    if (isStreaming) {
      abortRef.current?.abort();
    }
    newConversation(defaultModelId);
    inputRef.current?.clear();
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [defaultModelId, isStreaming, newConversation]);

  const reversed = useMemo(() => [...messages].reverse(), [messages]);

  const headerSubtitle = currentConversation
    ? getModelById(modelId).name
    : undefined;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ChatHeader
        title={currentConversation?.title ?? "GroqChat"}
        subtitle={headerSubtitle}
        onPressTitle={handlePickModel}
        onOpenHistory={handleOpenHistory}
        onOpenSettings={handleOpenSettings}
        onNewChat={handleNewChat}
      />

      {errorBanner ? (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: colors.destructive,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Feather name="alert-circle" size={16} color="#fff" />
          <Text style={styles.errorText} numberOfLines={3}>
            {errorBanner}
          </Text>
          <Pressable onPress={() => setErrorBanner(null)} hitSlop={10}>
            <Feather name="x" size={16} color="#fff" />
          </Pressable>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {messages.length === 0 ? (
          <View style={styles.flex}>
            <EmptyChatState
              hasApiKey={!!apiKey}
              onPressSuggestion={(prompt) => {
                void handleSend(prompt);
              }}
              onAddKey={handleOpenSettings}
            />
          </View>
        ) : (
          <FlatList
            data={reversed}
            inverted
            keyExtractor={(item) => item.id}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => {
              const realIndex = messages.length - 1 - index;
              const isLast = index === 0;
              const showStreaming =
                isStreaming && isLast && item.role === "assistant";
              const canEdit =
                item.role === "user" && realIndex === lastUserIndex;
              const canRetry =
                item.role === "assistant" &&
                !showStreaming &&
                item.content.length > 0;
              return (
                <MessageRow
                  message={item}
                  isStreaming={showStreaming}
                  canEdit={canEdit}
                  canRetry={canRetry}
                  showStats={tokenStatsEnabled}
                  onEdit={handleEditUserMessage}
                  onRetry={handleRetryAssistant}
                  onStopStreaming={handleStop}
                />
              );
            }}
          />
        )}

        <View
          style={{
            paddingBottom:
              Platform.OS === "web"
                ? Math.max(insets.bottom, 12)
                : Math.max(insets.bottom, 4),
          }}
        >
          <ChatInput
            ref={inputRef}
            modelId={modelId}
            onPickModel={handlePickModel}
            onSend={(t) => {
              void handleSend(t);
              inputRef.current?.focus();
            }}
            onStop={handleStop}
            isStreaming={isStreaming}
            disabled={!ready}
          />
          {!apiKey ? (
            <Pressable
              onPress={handleOpenSettings}
              style={({ pressed }) => [
                styles.keyHint,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name="key" size={12} color={colors.primary} />
              <Text style={[styles.keyHintText, { color: colors.mutedForeground }]}>
                Add your Groq API key to start chatting
              </Text>
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  listContent: {
    paddingVertical: 16,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 12,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    flex: 1,
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  keyHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingBottom: 6,
  },
  keyHintText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
