import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { memo, useCallback } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { ChatMessage } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { getModelById } from "@/lib/models";

interface Props {
  message: ChatMessage;
  isStreaming?: boolean;
  onLongPress?: (message: ChatMessage) => void;
}

function MessageRow({ message, isStreaming, onLongPress }: Props) {
  const colors = useColors();
  const isUser = message.role === "user";

  const handleLongPress = useCallback(() => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onLongPress?.(message);
  }, [message, onLongPress]);

  const modelName = message.modelId
    ? getModelById(message.modelId).name
    : null;

  if (isUser) {
    return (
      <View style={styles.row}>
        <View style={styles.userWrapper}>
          <Pressable
            onLongPress={handleLongPress}
            delayLongPress={300}
            style={({ pressed }) => [
              styles.userBubble,
              {
                backgroundColor: colors.userBubble,
                borderRadius: colors.radius + 4,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text
              style={[styles.userText, { color: colors.userBubbleText }]}
              selectable
            >
              {message.content}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={styles.assistantWrapper}>
        <View style={styles.assistantHeader}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.primary },
            ]}
          >
            <Feather name="zap" size={12} color={colors.primaryForeground} />
          </View>
          <Text
            style={[styles.assistantLabel, { color: colors.mutedForeground }]}
          >
            {modelName ?? "Assistant"}
          </Text>
        </View>

        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={300}
          style={({ pressed }) => [
            styles.assistantBubble,
            {
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          {message.content.length === 0 && isStreaming ? (
            <View style={styles.thinkingDots}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: colors.mutedForeground },
                  ]}
                />
              ))}
            </View>
          ) : (
            <Text
              style={[
                styles.assistantText,
                { color: colors.assistantBubbleText },
              ]}
              selectable
            >
              {message.content}
              {isStreaming ? (
                <Text style={{ color: colors.primary }}> ▍</Text>
              ) : null}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: "100%",
  },
  userWrapper: {
    alignSelf: "flex-end",
    maxWidth: "85%",
  },
  userBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
  },
  assistantWrapper: {
    alignSelf: "stretch",
    width: "100%",
  },
  assistantHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  assistantLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
  },
  assistantBubble: {
    paddingVertical: 2,
  },
  assistantText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "Inter_400Regular",
  },
  thinkingDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
});

export default memo(MessageRow);
