import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

const monoFont = Platform.select({
  ios: "Menlo",
  android: "monospace",
  web: "ui-monospace, SFMono-Regular, Menlo, monospace",
}) as string;

interface Props {
  code: string;
  language?: string;
}

export default function CodeBlock({ code, language }: Props) {
  const colors = useColors();
  const [copied, setCopied] = useState(false);

  const trimmed = code.replace(/\n+$/g, "");
  const langLabel = (language ?? "").trim().toLowerCase() || "code";

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(trimmed);
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [trimmed]);

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: 12,
        },
      ]}
    >
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.border, backgroundColor: colors.secondary },
        ]}
      >
        <Text style={[styles.lang, { color: colors.mutedForeground }]}>
          {langLabel}
        </Text>
        <Pressable
          onPress={handleCopy}
          hitSlop={6}
          style={({ pressed }) => [
            styles.copyBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather
            name={copied ? "check" : "copy"}
            size={13}
            color={copied ? colors.primary : colors.mutedForeground}
          />
          <Text
            style={[
              styles.copyText,
              { color: copied ? colors.primary : colors.mutedForeground },
            ]}
          >
            {copied ? "Copied" : "Copy"}
          </Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text
          selectable
          style={[
            styles.code,
            { color: colors.foreground, fontFamily: monoFont },
          ]}
        >
          {trimmed}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lang: {
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    fontFamily: "Inter_500Medium",
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  copyText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  code: {
    fontSize: 13,
    lineHeight: 19,
  },
});
