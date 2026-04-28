import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import React, { memo, useCallback, useState } from "react";
import {
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

import MarkdownText from "@/components/MarkdownText";
import type { ChatMessage } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { getModelById } from "@/lib/models";

interface Props {
  message: ChatMessage;
  isStreaming?: boolean;
  canEdit?: boolean;
  canRetry?: boolean;
  showStats?: boolean;
  onEdit?: (message: ChatMessage) => void;
  onRetry?: (message: ChatMessage) => void;
  onStopStreaming?: () => void;
}

function formatStats(
  stats: NonNullable<ChatMessage["stats"]>,
): string | null {
  const parts: string[] = [];
  if (typeof stats.totalTokens === "number") {
    parts.push(`${stats.totalTokens} tok`);
  } else if (typeof stats.completionTokens === "number") {
    parts.push(`${stats.completionTokens} tok`);
  }
  if (typeof stats.durationMs === "number") {
    const seconds = stats.durationMs / 1000;
    if (seconds < 10) {
      parts.push(`${seconds.toFixed(2)}s`);
    } else {
      parts.push(`${seconds.toFixed(1)}s`);
    }
    if (
      typeof stats.completionTokens === "number" &&
      stats.durationMs > 0
    ) {
      const tps = (stats.completionTokens / (stats.durationMs / 1000)).toFixed(0);
      parts.push(`${tps} tok/s`);
    }
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function MessageRow({
  message,
  isStreaming,
  canEdit,
  canRetry,
  showStats,
  onEdit,
  onRetry,
  onStopStreaming,
}: Props) {
  const colors = useColors();
  const isUser = message.role === "user";
  const [showUserActions, setShowUserActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(message.content);
    triggerHaptic();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [message.content, triggerHaptic]);

  const handleShare = useCallback(async () => {
    if (Platform.OS === "web") {
      await Clipboard.setStringAsync(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      return;
    }
    try {
      await Share.share({ message: message.content });
    } catch {
      // user cancelled
    }
  }, [message.content]);

  const handleEdit = useCallback(() => {
    triggerHaptic();
    setShowUserActions(false);
    onEdit?.(message);
  }, [message, onEdit, triggerHaptic]);

  const handleRetry = useCallback(() => {
    triggerHaptic();
    onRetry?.(message);
  }, [message, onRetry, triggerHaptic]);

  const handleToggleUserActions = useCallback(() => {
    setShowUserActions((s) => !s);
  }, []);

  const handleAssistantTap = useCallback(() => {
    if (isStreaming) {
      triggerHaptic();
      onStopStreaming?.();
    }
  }, [isStreaming, onStopStreaming, triggerHaptic]);

  const modelName = message.modelId
    ? getModelById(message.modelId).name
    : null;

  if (isUser) {
    return (
      <View style={styles.row}>
        <View style={styles.userWrapper}>
          <Pressable
            onPress={handleToggleUserActions}
            style={({ pressed }) => [
              styles.userBubble,
              {
                backgroundColor: colors.userBubble,
                borderRadius: colors.radius + 4,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            {message.attachment ? (
              <View
                style={[
                  styles.attachmentBadge,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.attachmentBadgeIcon,
                    { backgroundColor: `${colors.primary}22` },
                  ]}
                >
                  <Feather
                    name="file-text"
                    size={14}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flexShrink: 1, minWidth: 0 }}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.attachmentBadgeName,
                      { color: colors.foreground },
                    ]}
                  >
                    {message.attachment.name}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.attachmentBadgeSub,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {message.attachment.tokenEstimate < 1000
                      ? `${message.attachment.tokenEstimate} tok`
                      : `${(message.attachment.tokenEstimate / 1000).toFixed(1)}k tok`}
                    {" · "}
                    {message.attachment.lineCount} line
                    {message.attachment.lineCount === 1 ? "" : "s"}
                  </Text>
                </View>
              </View>
            ) : null}
            {message.content ? (
              <Text
                style={[
                  styles.userText,
                  { color: colors.userBubbleText },
                  message.attachment ? { marginTop: 8 } : null,
                ]}
                selectable
              >
                {message.content}
              </Text>
            ) : null}
          </Pressable>

          {showUserActions ? (
            <View style={styles.userActionsRow}>
              <Pressable
                onPress={handleCopy}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.actionPill,
                  {
                    backgroundColor: colors.secondary,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Feather
                  name={copied ? "check" : "copy"}
                  size={13}
                  color={copied ? colors.primary : colors.foreground}
                />
                <Text
                  style={[
                    styles.actionPillText,
                    { color: copied ? colors.primary : colors.foreground },
                  ]}
                >
                  {copied ? "Copied" : "Copy"}
                </Text>
              </Pressable>
              {canEdit ? (
                <Pressable
                  onPress={handleEdit}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.actionPill,
                    {
                      backgroundColor: colors.secondary,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Feather
                    name="edit-2"
                    size={13}
                    color={colors.foreground}
                  />
                  <Text
                    style={[
                      styles.actionPillText,
                      { color: colors.foreground },
                    ]}
                  >
                    Edit
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  const showActions = !isStreaming && message.content.length > 0;

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
          onPress={handleAssistantTap}
          disabled={!isStreaming}
          style={({ pressed }) => [
            styles.assistantBubble,
            { opacity: pressed && isStreaming ? 0.7 : 1 },
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
            <View>
              <MarkdownText content={message.content} />
              {isStreaming ? (
                <Text style={[styles.cursor, { color: colors.primary }]}>▍</Text>
              ) : null}
            </View>
          )}
          {isStreaming ? (
            <View
              style={[
                styles.stopHint,
                { backgroundColor: colors.secondary, borderColor: colors.border },
              ]}
            >
              <Feather name="square" size={10} color={colors.foreground} />
              <Text style={[styles.stopHintText, { color: colors.foreground }]}>
                Tap to stop
              </Text>
            </View>
          ) : null}
        </Pressable>

        {showActions ? (
          <View style={styles.assistantActionsRow}>
            <Pressable
              onPress={handleCopy}
              hitSlop={8}
              style={({ pressed }) => [
                styles.iconAction,
                { opacity: pressed ? 0.5 : 1 },
              ]}
            >
              <Feather
                name={copied ? "check" : "copy"}
                size={15}
                color={copied ? colors.primary : colors.mutedForeground}
              />
            </Pressable>
            <Pressable
              onPress={handleShare}
              hitSlop={8}
              style={({ pressed }) => [
                styles.iconAction,
                { opacity: pressed ? 0.5 : 1 },
              ]}
            >
              <Feather
                name="share"
                size={15}
                color={colors.mutedForeground}
              />
            </Pressable>
            {canRetry ? (
              <Pressable
                onPress={handleRetry}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.iconAction,
                  { opacity: pressed ? 0.5 : 1 },
                ]}
              >
                <Feather
                  name="refresh-cw"
                  size={15}
                  color={colors.mutedForeground}
                />
              </Pressable>
            ) : null}
            {showStats && message.stats ? (
              <View style={styles.statsWrap}>
                {(() => {
                  const text = formatStats(message.stats);
                  return text ? (
                    <Text
                      style={[styles.statsText, { color: colors.mutedForeground }]}
                    >
                      {text}
                    </Text>
                  ) : null;
                })()}
              </View>
            ) : null}
          </View>
        ) : null}
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
    alignItems: "flex-end",
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
  userActionsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  actionPillText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
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
  cursor: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "Inter_500Medium",
    marginTop: -4,
  },
  assistantActionsRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 6,
    marginLeft: -6,
  },
  iconAction: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  attachmentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 0,
    maxWidth: 240,
  },
  attachmentBadgeIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentBadgeName: {
    fontSize: 12.5,
    fontFamily: "Inter_600SemiBold",
  },
  attachmentBadgeSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  statsWrap: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  statsText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
  },
  stopHint: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
  },
  stopHintText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
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
