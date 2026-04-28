import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ConfirmModal from "@/components/ConfirmModal";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { validateGroqKey } from "@/lib/groq";
import { GROQ_MODELS, getModelById } from "@/lib/models";

function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 10) return "••••••••";
  return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    apiKey,
    setApiKey,
    clearApiKey,
    defaultModelId,
    setDefaultModelId,
    clearAllConversations,
    tokenStatsEnabled,
    setTokenStatsEnabled,
  } = useApp();

  const [draftKey, setDraftKey] = useState("");
  const [editing, setEditing] = useState(!apiKey);
  const [validating, setValidating] = useState(false);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [pendingRemoveKey, setPendingRemoveKey] = useState(false);
  const [pendingClearChats, setPendingClearChats] = useState(false);

  const handleSaveKey = async () => {
    const trimmed = draftKey.trim();
    if (!trimmed) {
      setValidationMsg("Please enter a key.");
      return;
    }
    setValidating(true);
    setValidationMsg(null);
    const ok = await validateGroqKey(trimmed);
    setValidating(false);
    if (!ok) {
      setValidationMsg("That key was rejected by Groq. Double-check it.");
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }
    await setApiKey(trimmed);
    setDraftKey("");
    setEditing(false);
    if (Platform.OS !== "web") {
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
    }
  };

  const handleRemoveKey = () => setPendingRemoveKey(true);
  const handleClearChats = () => setPendingClearChats(true);

  const handleToggleTokenStats = (val: boolean) => {
    if (Platform.OS !== "web") {
      void Haptics.selectionAsync();
    }
    void setTokenStatsEnabled(val);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={{ width: 40 }} />
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Settings
        </Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.iconBtn}
        >
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <KeyboardAwareScrollViewCompat
        style={styles.flex}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 32,
          gap: 24,
        }}
        bottomOffset={20}
      >
        <View>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Groq API key
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            {!editing && apiKey ? (
              <>
                <View style={styles.keyRow}>
                  <View
                    style={[
                      styles.keyIcon,
                      { backgroundColor: colors.accent, borderRadius: 10 },
                    ]}
                  >
                    <Feather name="key" size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.keyTitle, { color: colors.foreground }]}>
                      Connected
                    </Text>
                    <Text
                      style={[styles.keyMono, { color: colors.mutedForeground }]}
                    >
                      {maskKey(apiKey)}
                    </Text>
                  </View>
                </View>
                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={() => {
                      setDraftKey("");
                      setEditing(true);
                      setValidationMsg(null);
                    }}
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      {
                        borderColor: colors.border,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Feather
                      name="edit-2"
                      size={14}
                      color={colors.foreground}
                    />
                    <Text
                      style={[
                        styles.secondaryBtnText,
                        { color: colors.foreground },
                      ]}
                    >
                      Replace
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleRemoveKey}
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      {
                        borderColor: colors.border,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Feather
                      name="trash-2"
                      size={14}
                      color={colors.destructive}
                    />
                    <Text
                      style={[
                        styles.secondaryBtnText,
                        { color: colors.destructive },
                      ]}
                    >
                      Remove
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Paste your key
                </Text>
                <TextInput
                  value={draftKey}
                  onChangeText={setDraftKey}
                  placeholder="gsk_..."
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  secureTextEntry
                  style={[
                    styles.input,
                    {
                      borderColor: colors.border,
                      color: colors.foreground,
                      backgroundColor: colors.background,
                      borderRadius: colors.radius - 4,
                    },
                  ]}
                />
                {validationMsg ? (
                  <Text
                    style={[
                      styles.validationMsg,
                      { color: colors.destructive },
                    ]}
                  >
                    {validationMsg}
                  </Text>
                ) : null}
                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={handleSaveKey}
                    disabled={validating}
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      {
                        backgroundColor: colors.primary,
                        borderRadius: colors.radius - 4,
                        opacity: pressed || validating ? 0.85 : 1,
                      },
                    ]}
                  >
                    {validating ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.primaryForeground}
                      />
                    ) : (
                      <Feather
                        name="check"
                        size={16}
                        color={colors.primaryForeground}
                      />
                    )}
                    <Text
                      style={[
                        styles.primaryBtnText,
                        { color: colors.primaryForeground },
                      ]}
                    >
                      {validating ? "Verifying…" : "Save key"}
                    </Text>
                  </Pressable>
                  {apiKey ? (
                    <Pressable
                      onPress={() => {
                        setEditing(false);
                        setValidationMsg(null);
                      }}
                      style={({ pressed }) => [
                        styles.secondaryBtn,
                        {
                          borderColor: colors.border,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.secondaryBtnText,
                          { color: colors.foreground },
                        ]}
                      >
                        Cancel
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                <Pressable
                  onPress={() =>
                    Linking.openURL("https://console.groq.com/keys")
                  }
                  style={styles.link}
                >
                  <Feather
                    name="external-link"
                    size={12}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.linkText, { color: colors.primary }]}
                  >
                    Get a key at console.groq.com
                  </Text>
                </Pressable>
              </>
            )}
          </View>
          <Text
            style={[styles.helper, { color: colors.mutedForeground }]}
          >
            Your key is stored only on this device and sent directly to Groq.
            It never touches our servers.
          </Text>
        </View>

        <View>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Default model
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
                padding: 0,
                overflow: "hidden",
              },
            ]}
          >
            {GROQ_MODELS.map((m, idx) => {
              const selected = defaultModelId === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setDefaultModelId(m.id)}
                  style={({ pressed }) => [
                    styles.modelRow,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth:
                        idx === GROQ_MODELS.length - 1
                          ? 0
                          : StyleSheet.hairlineWidth,
                      backgroundColor: pressed
                        ? colors.secondary
                        : "transparent",
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.modelTitleRow}>
                      <Text
                        style={[
                          styles.modelName,
                          { color: colors.foreground },
                        ]}
                      >
                        {m.name}
                      </Text>
                      {m.badge ? (
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: colors.accent },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              { color: colors.accentForeground },
                            ]}
                          >
                            {m.badge}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.modelDesc,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {m.description}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      {
                        borderColor: selected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                  >
                    {selected ? (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.helper, { color: colors.mutedForeground }]}>
            Currently default: {getModelById(defaultModelId).name}. New chats
            start with this model — switch any time mid-chat.
          </Text>
        </View>

        <View>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Display
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <View style={styles.toggleRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text
                  style={[styles.toggleTitle, { color: colors.foreground }]}
                >
                  Show token & speed stats
                </Text>
                <Text
                  style={[
                    styles.toggleBody,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Display token count and response time under each reply.
                </Text>
              </View>
              <Switch
                value={tokenStatsEnabled}
                onValueChange={handleToggleTokenStats}
                trackColor={{
                  false: colors.border,
                  true: colors.primary,
                }}
                thumbColor={
                  Platform.OS === "android"
                    ? tokenStatsEnabled
                      ? colors.primaryForeground
                      : colors.card
                    : undefined
                }
                ios_backgroundColor={colors.border}
              />
            </View>
          </View>
        </View>

        <View>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Data
          </Text>
          <Pressable
            onPress={handleClearChats}
            style={({ pressed }) => [
              styles.dangerRow,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather name="trash-2" size={16} color={colors.destructive} />
            <Text style={[styles.dangerText, { color: colors.destructive }]}>
              Clear all chats
            </Text>
          </Pressable>
        </View>

        <View style={styles.aboutWrap}>
          <Text style={[styles.aboutTitle, { color: colors.foreground }]}>
            GroqChat
          </Text>
          <Text style={[styles.aboutBody, { color: colors.mutedForeground }]}>
            Bring-your-own-key chat with Groq's fastest models. Built for
            iOS and Android.
          </Text>
          <Link href="/" asChild>
            <Pressable hitSlop={10} style={styles.link}>
              <Feather name="message-circle" size={12} color={colors.primary} />
              <Text style={[styles.linkText, { color: colors.primary }]}>
                Back to chat
              </Text>
            </Pressable>
          </Link>
        </View>
      </KeyboardAwareScrollViewCompat>

      <ConfirmModal
        visible={pendingRemoveKey}
        title="Remove API key?"
        message="You will need to add it again to keep chatting."
        confirmLabel="Remove"
        destructive
        onConfirm={async () => {
          setPendingRemoveKey(false);
          await clearApiKey();
          setEditing(true);
        }}
        onCancel={() => setPendingRemoveKey(false)}
      />

      <ConfirmModal
        visible={pendingClearChats}
        title="Clear all chats?"
        message="Permanently delete every conversation on this device."
        confirmLabel="Clear all"
        destructive
        onConfirm={() => {
          clearAllConversations();
          setPendingClearChats(false);
        }}
        onCancel={() => setPendingClearChats(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
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
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },
  keyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  keyIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  keyTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  keyMono: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", web: "monospace" }),
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      web: "monospace",
    }),
  },
  validationMsg: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  primaryBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 12,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  linkText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  helper: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
    paddingHorizontal: 4,
    lineHeight: 17,
  },
  modelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modelTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  modelName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  modelDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
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
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dangerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dangerText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  toggleTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  toggleBody: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    lineHeight: 17,
  },
  aboutWrap: {
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  aboutTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  aboutBody: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 17,
  },
});
