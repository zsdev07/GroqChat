import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { ExtractedFile } from "@/lib/fileExtractor";

interface Props {
  file: ExtractedFile;
  onRemove: () => void;
}

function formatTokens(n: number): string {
  if (n < 1000) return `${n} tok`;
  return `${(n / 1000).toFixed(1)}k tok`;
}

export default function AttachmentChip({ file, onRemove }: Props) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: colors.secondary,
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: `${colors.primary}22` },
        ]}
      >
        <Feather name="file-text" size={16} color={colors.primary} />
      </View>
      <View style={styles.meta}>
        <Text
          numberOfLines={1}
          style={[styles.name, { color: colors.foreground }]}
        >
          {file.name}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.sub, { color: colors.mutedForeground }]}
        >
          {formatTokens(file.tokenEstimate)} · {file.lineCount} line
          {file.lineCount === 1 ? "" : "s"}
        </Text>
      </View>
      <Pressable
        onPress={onRemove}
        hitSlop={10}
        style={({ pressed }) => [
          styles.removeBtn,
          {
            backgroundColor: pressed ? colors.border : "transparent",
          },
        ]}
      >
        <Feather name="x" size={14} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    maxWidth: 280,
    minWidth: 0,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  meta: {
    flexShrink: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 12.5,
    fontFamily: "Inter_600SemiBold",
  },
  sub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
