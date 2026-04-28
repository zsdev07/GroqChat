import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ConfirmModal from "@/components/ConfirmModal";
import { useApp, type Conversation } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { getModelById } from "@/lib/models";

function formatRelative(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    conversations,
    currentConversationId,
    selectConversation,
    deleteConversation,
    newConversation,
    defaultModelId,
    clearAllConversations,
  } = useApp();

  const [pendingDelete, setPendingDelete] = useState<Conversation | null>(null);
  const [pendingClearAll, setPendingClearAll] = useState(false);

  const sorted = useMemo(
    () => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt),
    [conversations],
  );

  const handleSelect = (id: string) => {
    selectConversation(id);
    router.back();
  };

  const handleNew = () => {
    newConversation(defaultModelId);
    router.back();
  };

  const nonEmpty = sorted.filter((c) => c.messages.length > 0);

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.iconBtn}
        >
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Chats
        </Text>
        <Pressable
          onPress={handleNew}
          hitSlop={10}
          style={styles.iconBtn}
        >
          <Feather name="edit" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {nonEmpty.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: colors.secondary, borderRadius: colors.radius },
            ]}
          >
            <Feather
              name="message-square"
              size={26}
              color={colors.mutedForeground}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No chats yet
          </Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
            Start a conversation to see your history here.
          </Text>
          <Pressable
            onPress={handleNew}
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: colors.primary,
                borderRadius: colors.radius,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather name="plus" size={16} color={colors.primaryForeground} />
            <Text
              style={[
                styles.primaryBtnText,
                { color: colors.primaryForeground },
              ]}
            >
              Start a new chat
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={nonEmpty}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingVertical: 8,
            paddingBottom: insets.bottom + 24,
          }}
          ItemSeparatorComponent={() => (
            <View style={[styles.sep, { backgroundColor: colors.border }]} />
          )}
          renderItem={({ item }) => {
            const isActive = item.id === currentConversationId;
            const lastMsg = item.messages[item.messages.length - 1];
            const preview = lastMsg
              ? lastMsg.content.replace(/\s+/g, " ").trim()
              : "No messages yet";
            return (
              <View
                style={[
                  styles.row,
                  {
                    backgroundColor: isActive
                      ? colors.accent
                      : "transparent",
                  },
                ]}
              >
                <Pressable
                  onPress={() => handleSelect(item.id)}
                  style={({ pressed }) => [
                    styles.rowMain,
                    {
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <View style={styles.titleRow}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.title,
                        {
                          color: isActive
                            ? colors.accentForeground
                            : colors.foreground,
                        },
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[styles.time, { color: colors.mutedForeground }]}
                    >
                      {formatRelative(item.updatedAt)}
                    </Text>
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[styles.preview, { color: colors.mutedForeground }]}
                  >
                    {preview}
                  </Text>
                  <View style={styles.metaRow}>
                    <View
                      style={[
                        styles.modelTag,
                        { backgroundColor: colors.secondary },
                      ]}
                    >
                      <Feather name="zap" size={10} color={colors.primary} />
                      <Text
                        style={[
                          styles.modelTagText,
                          { color: colors.foreground },
                        ]}
                      >
                        {getModelById(item.modelId).name}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.msgCount,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {item.messages.length} message
                      {item.messages.length === 1 ? "" : "s"}
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => setPendingDelete(item)}
                  hitSlop={12}
                  style={({ pressed }) => [
                    styles.deleteBtn,
                    {
                      backgroundColor: pressed
                        ? `${colors.destructive}22`
                        : "transparent",
                    },
                  ]}
                >
                  <Feather
                    name="trash-2"
                    size={18}
                    color={colors.destructive}
                  />
                </Pressable>
              </View>
            );
          }}
          ListFooterComponent={
            nonEmpty.length > 1 ? (
              <Pressable
                onPress={() => setPendingClearAll(true)}
                style={({ pressed }) => [
                  styles.clearBtn,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Feather
                  name="trash-2"
                  size={14}
                  color={colors.destructive}
                />
                <Text
                  style={[styles.clearBtnText, { color: colors.destructive }]}
                >
                  Clear all chats
                </Text>
              </Pressable>
            ) : null
          }
        />
      )}

      <ConfirmModal
        visible={!!pendingDelete}
        title="Delete chat?"
        message={
          pendingDelete
            ? `"${pendingDelete.title}" will be permanently removed from this device.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (pendingDelete) {
            deleteConversation(pendingDelete.id);
          }
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmModal
        visible={pendingClearAll}
        title="Clear all chats?"
        message="Every conversation on this device will be permanently deleted."
        confirmLabel="Clear all"
        destructive
        onConfirm={() => {
          clearAllConversations();
          setPendingClearAll(false);
          router.back();
        }}
        onCancel={() => setPendingClearAll(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },
  rowMain: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  time: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  preview: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  modelTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  modelTagText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  msgCount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  deleteBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 16,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
  },
  clearBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
