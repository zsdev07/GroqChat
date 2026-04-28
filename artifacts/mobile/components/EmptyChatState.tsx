import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Suggestion {
  title: string;
  subtitle: string;
  prompt: string;
  icon: keyof typeof Feather.glyphMap;
}

const SUGGESTIONS: Suggestion[] = [
  {
    title: "Explain quantum entanglement",
    subtitle: "in simple, vivid terms",
    prompt: "Explain quantum entanglement in simple, vivid terms with an everyday analogy.",
    icon: "compass",
  },
  {
    title: "Plan a 3-day trip",
    subtitle: "to Tokyo this spring",
    prompt: "Plan a 3-day itinerary for Tokyo this spring focused on food and quiet neighborhoods.",
    icon: "map",
  },
  {
    title: "Write a SQL query",
    subtitle: "to find top customers",
    prompt: "Write a SQL query to find the top 10 customers by total spend in the last 30 days.",
    icon: "code",
  },
  {
    title: "Brainstorm names",
    subtitle: "for an indie coffee shop",
    prompt: "Brainstorm 10 distinctive name ideas for an indie coffee shop with a minimalist vibe.",
    icon: "feather",
  },
];

interface Props {
  hasApiKey: boolean;
  onPressSuggestion: (text: string) => void;
  onAddKey: () => void;
}

export default function EmptyChatState({
  hasApiKey,
  onPressSuggestion,
  onAddKey,
}: Props) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.logo,
          {
            backgroundColor: colors.primary,
            borderRadius: colors.radius + 6,
          },
        ]}
      >
        <Feather name="zap" size={28} color={colors.primaryForeground} />
      </View>

      <Text style={[styles.title, { color: colors.foreground }]}>
        How can I help today?
      </Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Ask anything. Switch models mid-conversation.
      </Text>

      {!hasApiKey ? (
        <Pressable
          onPress={onAddKey}
          style={({ pressed }) => [
            styles.keyCta,
            {
              backgroundColor: colors.accent,
              borderColor: colors.primary,
              borderRadius: colors.radius,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Feather name="key" size={16} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.keyTitle, { color: colors.foreground }]}>
              Add your Groq API key
            </Text>
            <Text
              style={[styles.keySubtitle, { color: colors.mutedForeground }]}
            >
              Bring your own key — keys stay on this device.
            </Text>
          </View>
          <Feather
            name="chevron-right"
            size={18}
            color={colors.mutedForeground}
          />
        </Pressable>
      ) : (
        <View style={styles.suggestions}>
          {SUGGESTIONS.map((s) => (
            <Pressable
              key={s.title}
              onPress={() => onPressSuggestion(s.prompt)}
              style={({ pressed }) => [
                styles.suggestion,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.suggestionIcon,
                  {
                    backgroundColor: colors.accent,
                    borderRadius: 10,
                  },
                ]}
              >
                <Feather
                  name={s.icon}
                  size={14}
                  color={colors.accentForeground}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.suggestionTitle, { color: colors.foreground }]}
                >
                  {s.title}
                </Text>
                <Text
                  style={[
                    styles.suggestionSubtitle,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {s.subtitle}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  logo: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 16,
  },
  keyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    width: "100%",
    maxWidth: 420,
    marginTop: 8,
  },
  keyTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  keySubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  suggestions: {
    width: "100%",
    maxWidth: 420,
    gap: 10,
    marginTop: 12,
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  suggestionIcon: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionTitle: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  suggestionSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
