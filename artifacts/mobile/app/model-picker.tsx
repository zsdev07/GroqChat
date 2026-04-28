import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { GROQ_MODELS } from "@/lib/models";

export default function ModelPickerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    currentConversation,
    setConversationModel,
    defaultModelId,
    setDefaultModelId,
    newConversation,
  } = useApp();

  const activeModelId = currentConversation?.modelId ?? defaultModelId;

  const handleSelect = (modelId: string) => {
    if (Platform.OS !== "web") {
      void Haptics.selectionAsync();
    }
    if (currentConversation) {
      setConversationModel(currentConversation.id, modelId);
    } else {
      newConversation(modelId);
      void setDefaultModelId(modelId);
    }
    router.back();
  };

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={{ width: 40 }} />
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Choose a model
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.mutedForeground }]}
          >
            Switch mid-conversation — no new chat needed
          </Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.iconBtn}
        >
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 12,
          paddingBottom: insets.bottom + 24,
          gap: 8,
        }}
      >
        {GROQ_MODELS.map((m) => {
          const selected = activeModelId === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => handleSelect(m.id)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: selected ? colors.accent : colors.card,
                  borderColor: selected ? colors.primary : colors.border,
                  borderRadius: colors.radius,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: selected
                      ? colors.primary
                      : colors.secondary,
                    borderRadius: 12,
                  },
                ]}
              >
                <Feather
                  name="zap"
                  size={16}
                  color={selected ? colors.primaryForeground : colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      styles.title,
                      {
                        color: selected
                          ? colors.accentForeground
                          : colors.foreground,
                      },
                    ]}
                  >
                    {m.name}
                  </Text>
                  {m.badge ? (
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: selected
                            ? colors.primary
                            : colors.accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color: selected
                              ? colors.primaryForeground
                              : colors.accentForeground,
                          },
                        ]}
                      >
                        {m.badge}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.description,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {m.description}
                </Text>
                <Text
                  style={[styles.context, { color: colors.mutedForeground }]}
                >
                  {(m.contextWindow / 1000).toFixed(0)}K context
                </Text>
              </View>
              {selected ? (
                <Feather name="check" size={18} color={colors.primary} />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  description: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  context: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: 6,
    letterSpacing: 0.3,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.4,
  },
});
