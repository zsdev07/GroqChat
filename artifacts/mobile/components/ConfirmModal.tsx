import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  const colors = useColors();

  const confirmColor = destructive ? colors.destructive : colors.primary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: 16,
            },
          ]}
        >
          {destructive ? (
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: `${colors.destructive}22` },
              ]}
            >
              <Feather
                name="alert-triangle"
                size={20}
                color={colors.destructive}
              />
            </View>
          ) : null}
          <Text style={[styles.title, { color: colors.foreground }]}>
            {title}
          </Text>
          {message ? (
            <Text style={[styles.body, { color: colors.mutedForeground }]}>
              {message}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.btn,
                {
                  borderColor: colors.border,
                  backgroundColor: pressed ? colors.secondary : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  styles.btnText,
                  { color: colors.foreground },
                ]}
              >
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.btn,
                {
                  backgroundColor: confirmColor,
                  borderColor: confirmColor,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={[styles.btnText, { color: "#fff" }]}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    padding: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  body: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 19,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    alignSelf: "stretch",
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
