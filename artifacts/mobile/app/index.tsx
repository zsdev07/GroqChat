import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
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
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ChatHeader from "@/components/ChatHeader";
import ChatInput from "@/components/ChatInput";
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
  const inputRef = useRef<TextInput>(null);
  const abortRef = useRef<AbortController | null>(null);

  const {
    ready,
    apiKey,
    defaultModelId,
    currentConversation,
    newConversation,
    setConversationModel,
    appendMessage,
    updateLastAssistantMessage,
    removeMessage,
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

  const handleSend = useCallback(
    async (text: string) => {
      if (!conversationId) return;
      if (!apiKey) {
        router.push("/settings");
        return;
      }

      setErrorBanner(null);
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
      appendMessage(conversationId, assistantMessage);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const history: ChatMessage[] = [...messages, userMessage];

      let accumulated = "";
      try {
        await streamGroq({
          apiKey,
          model: modelId,
          messages: history,
          signal: controller.signal,
          onChunk: (chunk) => {
            accumulated += chunk;
            updateLastAssistantMessage(conversationId, (msg) => ({
              ...msg,
              content: accumulated,
            }));
          },
        });

        if (accumulated.length === 0) {
          updateLastAssistantMessage(conversationId, (msg) => ({
            ...msg,
            content: "(No response from model)",
          }));
        }

        if (Platform.OS !== "web") {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          if (accumulated.length === 0) {
            removeMessage(conversationId, assistantMessage.id);
          } else {
            updateLastAssistantMessage(conversationId, (msg) => ({
              ...msg,
              content: `${msg.content}\n\n_(stopped)_`,
            }));
          }
        } else {
          const message =
            err instanceof Error ? err.message : "Something went wrong";
          removeMessage(conversationId, assistantMessage.id);
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
      conversationId,
      apiKey,
      modelId,
      messages,
      appendMessage,
      updateLastAssistantMessage,
      removeMessage,
      router,
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
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [defaultModelId, isStreaming, newConversation]);

  const handleLongPressMessage = useCallback((message: ChatMessage) => {
    if (Platform.OS === "web") {
      void Clipboard.setStringAsync(message.content);
      return;
    }
    Alert.alert("Message", undefined, [
      {
        text: "Copy",
        onPress: () => {
          void Clipboard.setStringAsync(message.content);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, []);

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
              const isLast = index === 0;
              const showStreaming =
                isStreaming && isLast && item.role === "assistant";
              return (
                <MessageRow
                  message={item}
                  isStreaming={showStreaming}
                  onLongPress={handleLongPressMessage}
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
