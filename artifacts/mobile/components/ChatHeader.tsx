import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface Props {
  title: string;
  subtitle?: string;
  onOpenHistory: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onPressTitle?: () => void;
}

export default function ChatHeader({
  title,
  subtitle,
  onOpenHistory,
  onNewChat,
  onOpenSettings,
  onPressTitle,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? Math.max(insets.top, 12) : insets.top;

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingTop: topPad,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {Platform.OS === "ios" ? (
        <BlurView
          intensity={80}
          tint={scheme === "dark" ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.background },
          ]}
        />
      )}

      <View style={styles.row}>
        <Pressable
          onPress={onOpenHistory}
          style={({ pressed }) => [
            styles.iconBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}
          hitSlop={10}
        >
          <Feather name="menu" size={22} color={colors.foreground} />
        </Pressable>

        <Pressable
          onPress={onPressTitle}
          style={styles.titleWrap}
          disabled={!onPressTitle}
          hitSlop={6}
        >
          <Text
            numberOfLines={1}
            style={[styles.title, { color: colors.foreground }]}
          >
            {title}
          </Text>
          {subtitle ? (
            <View style={styles.subtitleRow}>
              <Feather name="zap" size={10} color={colors.primary} />
              <Text
                numberOfLines={1}
                style={[styles.subtitle, { color: colors.mutedForeground }]}
              >
                {subtitle}
              </Text>
              {onPressTitle ? (
                <Feather
                  name="chevron-down"
                  size={12}
                  color={colors.mutedForeground}
                />
              ) : null}
            </View>
          ) : null}
        </Pressable>

        <View style={styles.rightActions}>
          <Pressable
            onPress={onNewChat}
            style={({ pressed }) => [
              styles.iconBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            hitSlop={10}
          >
            <Feather name="edit" size={20} color={colors.foreground} />
          </Pressable>
          <Pressable
            onPress={onOpenSettings}
            style={({ pressed }) => [
              styles.iconBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            hitSlop={10}
          >
            <Feather name="more-horizontal" size={22} color={colors.foreground} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 8,
    minHeight: 52,
    gap: 4,
  },
  titleWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    maxWidth: 200,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
});
