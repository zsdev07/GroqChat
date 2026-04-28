import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { forwardRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { getModelById } from "@/lib/models";

interface Props {
  modelId: string;
  onPickModel: () => void;
  onSend: (text: string) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
}

const ChatInput = forwardRef<TextInput, Props>(function ChatInput(
  { modelId, onPickModel, onSend, onStop, isStreaming, disabled },
  ref,
) {
  const colors = useColors();
  const [value, setValue] = useState("");
  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !disabled && !isStreaming;

  const handleSend = () => {
    if (!canSend) return;
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSend(trimmed);
    setValue("");
  };

  const model = getModelById(modelId);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.inputBackground,
          borderColor: colors.border,
          borderRadius: colors.radius + 12,
        },
      ]}
    >
      <TextInput
        ref={ref}
        value={value}
        onChangeText={setValue}
        placeholder="Message GroqChat…"
        placeholderTextColor={colors.mutedForeground}
        multiline
        editable={!disabled}
        blurOnSubmit={false}
        style={[
          styles.input,
          { color: colors.foreground, fontFamily: "Inter_400Regular" },
        ]}
      />

      <View style={styles.actions}>
        <Pressable
          onPress={onPickModel}
          style={({ pressed }) => [
            styles.modelChip,
            {
              backgroundColor: colors.secondary,
              borderRadius: 999,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          hitSlop={6}
        >
          <Feather name="zap" size={12} color={colors.primary} />
          <Text
            numberOfLines={1}
            style={[
              styles.modelText,
              { color: colors.foreground },
            ]}
          >
            {model.name}
          </Text>
          <Feather
            name="chevron-down"
            size={14}
            color={colors.mutedForeground}
          />
        </Pressable>

        <View style={{ flex: 1 }} />

        {isStreaming ? (
          <Pressable
            onPress={onStop}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor: colors.foreground,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            hitSlop={8}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                backgroundColor: colors.background,
              }}
            />
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor: canSend
                  ? colors.primary
                  : colors.secondary,
                opacity: pressed && canSend ? 0.85 : 1,
              },
            ]}
            hitSlop={8}
          >
            <Feather
              name="arrow-up"
              size={18}
              color={
                canSend ? colors.primaryForeground : colors.mutedForeground
              }
            />
          </Pressable>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
    minHeight: 24,
    maxHeight: 140,
    paddingTop: 0,
    paddingBottom: 0,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  modelChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 220,
  },
  modelText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    maxWidth: 160,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ChatInput;
