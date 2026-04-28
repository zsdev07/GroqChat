import React, { useMemo } from "react";
import { Platform, StyleSheet } from "react-native";
import Markdown, { type RenderRules } from "react-native-markdown-display";

import { useColors } from "@/hooks/useColors";

const monoFont = Platform.select({
  ios: "Menlo",
  android: "monospace",
  web: "ui-monospace, SFMono-Regular, Menlo, monospace",
}) as string;

interface Props {
  content: string;
}

export default function MarkdownText({ content }: Props) {
  const colors = useColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          color: colors.assistantBubbleText,
          fontFamily: "Inter_400Regular",
          fontSize: 16,
          lineHeight: 24,
        },
        paragraph: {
          marginTop: 0,
          marginBottom: 8,
          color: colors.assistantBubbleText,
          fontFamily: "Inter_400Regular",
          fontSize: 16,
          lineHeight: 24,
        },
        strong: {
          color: colors.assistantBubbleText,
          fontFamily: "Inter_700Bold",
          fontWeight: "700",
        },
        em: {
          fontStyle: "italic",
          color: colors.assistantBubbleText,
        },
        s: {
          textDecorationLine: "line-through",
          color: colors.mutedForeground,
        },
        link: {
          color: colors.primary,
          textDecorationLine: "underline",
        },
        heading1: {
          fontFamily: "Inter_700Bold",
          fontSize: 22,
          lineHeight: 28,
          color: colors.assistantBubbleText,
          marginTop: 12,
          marginBottom: 8,
        },
        heading2: {
          fontFamily: "Inter_700Bold",
          fontSize: 19,
          lineHeight: 26,
          color: colors.assistantBubbleText,
          marginTop: 12,
          marginBottom: 6,
        },
        heading3: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 17,
          lineHeight: 24,
          color: colors.assistantBubbleText,
          marginTop: 10,
          marginBottom: 4,
        },
        heading4: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 15,
          lineHeight: 22,
          color: colors.assistantBubbleText,
          marginTop: 8,
          marginBottom: 4,
        },
        heading5: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 14,
          color: colors.assistantBubbleText,
          marginTop: 6,
          marginBottom: 2,
        },
        heading6: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 13,
          color: colors.mutedForeground,
          marginTop: 6,
          marginBottom: 2,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        bullet_list: {
          marginVertical: 4,
        },
        ordered_list: {
          marginVertical: 4,
        },
        list_item: {
          marginVertical: 2,
          color: colors.assistantBubbleText,
        },
        bullet_list_icon: {
          color: colors.primary,
          marginLeft: 0,
          marginRight: 8,
          lineHeight: 24,
          fontSize: 16,
        },
        ordered_list_icon: {
          color: colors.mutedForeground,
          marginLeft: 0,
          marginRight: 8,
          lineHeight: 24,
          fontSize: 16,
          fontFamily: "Inter_500Medium",
        },
        code_inline: {
          fontFamily: monoFont,
          fontSize: 14,
          backgroundColor: colors.secondary,
          color: colors.foreground,
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 6,
          borderWidth: 0,
        },
        code_block: {
          fontFamily: monoFont,
          fontSize: 13,
          lineHeight: 19,
          backgroundColor: colors.card,
          color: colors.foreground,
          padding: 12,
          borderRadius: 12,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          marginVertical: 8,
        },
        fence: {
          fontFamily: monoFont,
          fontSize: 13,
          lineHeight: 19,
          backgroundColor: colors.card,
          color: colors.foreground,
          padding: 12,
          borderRadius: 12,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          marginVertical: 8,
        },
        blockquote: {
          backgroundColor: colors.secondary,
          borderLeftWidth: 3,
          borderLeftColor: colors.primary,
          paddingHorizontal: 12,
          paddingVertical: 6,
          marginVertical: 6,
          borderRadius: 8,
        },
        hr: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          marginVertical: 12,
        },
        table: {
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          borderRadius: 8,
          marginVertical: 8,
        },
        thead: {
          backgroundColor: colors.secondary,
        },
        th: {
          padding: 8,
          fontFamily: "Inter_600SemiBold",
          color: colors.foreground,
        },
        td: {
          padding: 8,
          color: colors.assistantBubbleText,
        },
        tr: {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
      }),
    [colors],
  );

  const rules = useMemo<RenderRules>(
    () => ({}),
    [],
  );

  return (
    <Markdown style={styles} rules={rules}>
      {content}
    </Markdown>
  );
}
