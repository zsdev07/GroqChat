import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import AttachmentChip from "@/components/AttachmentChip";
import { useColors } from "@/hooks/useColors";
import {
  describeError,
  extractFile,
  type ExtractedFile,
} from "@/lib/fileExtractor";
import { getModelById } from "@/lib/models";

export interface ChatInputHandle {
  focus: () => void;
  blur: () => void;
  setText: (text: string) => void;
  clear: () => void;
}

interface Props {
  modelId: string;
  onPickModel: () => void;
  onSend: (text: string, attachment: ExtractedFile | null) => void;
  onStop?: () => void;
  onAttachmentError?: (message: string) => void;
  isStreaming?: boolean;
  disabled?: boolean;
}

const ChatInput = forwardRef<ChatInputHandle, Props>(function ChatInput(
  {
    modelId,
    onPickModel,
    onSend,
    onStop,
    onAttachmentError,
    isStreaming,
    disabled,
  },
  ref,
) {
  const colors = useColors();
  const inputRef = useRef<TextInput>(null);
  const [value, setValue] = useState("");
  const [attachment, setAttachment] = useState<ExtractedFile | null>(null);
  const [picking, setPicking] = useState(false);
  const trimmed = value.trim();
  const canSend =
    (trimmed.length > 0 || !!attachment) && !disabled && !isStreaming;

  useImperativeHandle(
    ref,
    () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      setText: (text: string) => {
        setValue(text);
        setTimeout(() => inputRef.current?.focus(), 50);
      },
      clear: () => {
        setValue("");
        setAttachment(null);
      },
    }),
    [],
  );

  const handleSend = () => {
    if (!canSend) return;
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSend(trimmed, attachment);
    setValue("");
    setAttachment(null);
  };

  const handlePickFile = async () => {
    if (picking || disabled) return;
    setPicking(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: "*/*",
      });
      if (res.canceled) return;
      const asset = res.assets[0];
      if (!asset) return;
      const result = await extractFile({
        uri: asset.uri,
        name: asset.name,
        size: asset.size,
        mimeType: asset.mimeType,
      });
      if (!result.ok) {
        if (Platform.OS !== "web") {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error,
          );
        }
        onAttachmentError?.(describeError(result.error));
        return;
      }
      setAttachment(result.file);
      if (Platform.OS !== "web") {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (err) {
      onAttachmentError?.(
        err instanceof Error ? err.message : "Couldn't open the file picker.",
      );
    } finally {
      setPicking(false);
    }
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
      {attachment ? (
        <View style={styles.attachmentRow}>
          <AttachmentChip
            file={attachment}
            onRemove={() => setAttachment(null)}
          />
        </View>
      ) : null}

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={setValue}
        placeholder={
          attachment ? "Add a question about this file…" : "Message GroqChat…"
        }
        placeholderTextColor={colors.mutedForeground}
        multiline
        editable={!disabled}
        blurOnSubmit={false}
        underlineColorAndroid="transparent"
        selectionColor={colors.primary}
        style={[
          styles.input,
          { color: colors.foreground, fontFamily: "Inter_400Regular" },
          Platform.OS === "web"
            ? ({
                outlineStyle: "none",
                outlineWidth: 0,
                outlineColor: "transparent",
              } as object)
            : null,
        ]}
      />

      <View style={styles.actions}>
        <Pressable
          onPress={handlePickFile}
          disabled={picking || disabled}
          hitSlop={6}
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: pressed ? colors.secondary : "transparent",
              opacity: picking || disabled ? 0.5 : 1,
            },
          ]}
        >
          <Feather name="paperclip" size={18} color={colors.mutedForeground} />
        </Pressable>

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
            style={[styles.modelText, { color: colors.foreground }]}
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
                backgroundColor: canSend ? colors.primary : colors.secondary,
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
  attachmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
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
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  modelChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 180,
  },
  modelText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    maxWidth: 120,
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
