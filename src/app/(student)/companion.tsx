import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import CallButton from "@/components/crisis/CallButton";
import { EMERGENCY, HELPLINES, type Helpline } from "@/constants/helplines";
import {
  COMPANION_MODEL,
  MAX_COMPANION_MESSAGE_LENGTH,
  MAX_COMPANION_MESSAGES,
  type CompanionMessage,
  sendCompanionMessage,
} from "@/services/companionService";
import { containsCrisisLanguage } from "@/utils/crisisCheck";
import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CONSENT_KEY = "breathe-companion-consent-v1";
const STARTERS = ["I'm stressed about exams", "I can't sleep", "Help me breathe"];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function CrisisCard() {
  const lines: Helpline[] = [...EMERGENCY, ...HELPLINES];

  return (
    <Card variant="success">
      <Text style={typography.heading} accessibilityRole="header">
        You deserve immediate support
      </Text>
      <Text style={[typography.body, styles.crisisText]}>
        I can't help with self-harm. If you may act on these thoughts or are in danger, call now or open Crisis Support.
      </Text>
      {lines.map((line) => (
        <View key={line.id} style={styles.helpline}>
          <View style={styles.helplineCopy}>
            <Text style={styles.helplineName}>{line.name}</Text>
            <Text style={typography.caption}>{line.number}</Text>
          </View>
          <CallButton helpline={line} />
        </View>
      ))}
      <Button
        title="Crisis support"
        icon="heart-outline"
        variant="secondary"
        onPress={() => router.push("/crisis")}
      />
    </Card>
  );
}

function ActionChip({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.actionChip, pressed && styles.pressed]}
    >
      <Text style={styles.actionChipText}>{title}</Text>
    </Pressable>
  );
}

function MessageBubble({ message }: { message: CompanionMessage }) {
  const isModel = message.role === "model";

  return (
    <View style={[styles.messageRow, isModel ? styles.modelRow : styles.userRow]}>
      <View style={[styles.bubble, isModel ? styles.modelBubble : styles.userBubble]}>
        <Text style={[styles.bubbleText, isModel && styles.modelBubbleText]}>{message.text}</Text>
      </View>
      {isModel ? (
        <View style={styles.actions}>
          <ActionChip title="Book a counsellor" onPress={() => router.push("/(student)/sessions")} />
          <ActionChip title="Crisis support" onPress={() => router.push("/crisis")} />
        </View>
      ) : null}
    </View>
  );
}

export default function Companion() {
  const [consent, setConsent] = useState(false);
  const [consentLoaded, setConsentLoaded] = useState(false);
  const [messages, setMessages] = useState<CompanionMessage[]>([]);
  const [input, setInput] = useState("");
  const [crisis, setCrisis] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [retryText, setRetryText] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(CONSENT_KEY)
      .then((value) => setConsent(value === "understood"))
      .finally(() => setConsentLoaded(true));
  }, []);

  const messageCount = messages.length;
  const canSend = input.trim().length > 0 && !busy && messageCount < MAX_COMPANION_MESSAGES - 1;
  const counterText = `${input.length}/${MAX_COMPANION_MESSAGE_LENGTH} · ${messageCount}/${MAX_COMPANION_MESSAGES} messages`;
  const emptyState = useMemo(() => messages.length === 0 && !crisis, [messages.length, crisis]);

  async function acceptConsent() {
    await AsyncStorage.setItem(CONSENT_KEY, "understood");
    setConsent(true);
  }

  async function submit(text = input.trim(), isRetry = false) {
    const trimmed = text.trim();
    if (!trimmed || busy || (!isRetry && messageCount >= MAX_COMPANION_MESSAGES - 1)) return;

    setError(false);
    setRetryText(null);

    if (containsCrisisLanguage(trimmed)) {
      if (!isRetry) {
        setMessages((current) => [
          ...current,
          { id: makeId(), role: "user", text: trimmed },
        ]);
        setInput("");
      }
      setCrisis(true);
      return;
    }

    const previousMessages = isRetry ? messages.slice(0, -1) : messages;
    if (!isRetry) {
      setMessages((current) => [
        ...current,
        { id: makeId(), role: "user", text: trimmed },
      ]);
      setInput("");
    }

    setBusy(true);
    try {
      const response = await sendCompanionMessage(previousMessages, trimmed);
      if (response.kind === "crisis") {
        setCrisis(true);
      } else {
        setMessages((current) => [
          ...current,
          { id: makeId(), role: "model", text: response.text },
        ]);
      }
    } catch {
      setError(true);
      setRetryText(trimmed);
    } finally {
      setBusy(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setCrisis(false);
    setError(false);
    setRetryText(null);
    setInput("");
  }

  if (!consentLoaded) {
    return <SafeAreaView style={styles.safe} />;
  }

  if (!consent) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.consentContainer}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={28} color={colors.primary} />
          </View>
          <Text style={typography.title} accessibilityRole="header">
            Breathe Companion
          </Text>
          <Card>
            <Text style={typography.heading}>Before you continue</Text>
            <Text style={[typography.body, styles.consentText]}>
              Google's Gemini AI processes the messages you send here. We do not send your name, email, student ID, uid, or anonymous ID. Chats stay in memory on this device and are not saved to our database.
            </Text>
            <Text style={[typography.caption, styles.consentText]}>
              Breathe Companion is an AI, not a counsellor. It cannot provide emergency, medical, or medication advice.
            </Text>
          </Card>
          <Button title="I understand" icon="arrow-forward" onPress={acceptConsent} />
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <Text style={styles.backText}>Not now</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={styles.topBar}>
          <View style={styles.titleBlock}>
            <Text style={typography.heading} accessibilityRole="header">Breathe Companion</Text>
            <Text style={typography.caption}>A gentle space to talk things through</Text>
          </View>
          <Pressable
            onPress={clearChat}
            accessibilityRole="button"
            accessibilityLabel="Clear chat"
            style={styles.clearButton}
          >
            <Ionicons name="trash-outline" size={20} color={colors.primary} />
            <Text style={styles.clearText}>Clear chat</Text>
          </Pressable>
        </View>

        <View style={styles.banner} accessible accessibilityLabel="Breathe Companion is an AI, not a counsellor. In an emergency call 1926 or 1990.">
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.bannerText}>Breathe Companion is an AI, not a counsellor. In an emergency call 1926 or 1990.</Text>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {emptyState ? (
                <View style={styles.starterArea}>
                  <Text style={styles.welcomeText}>What’s on your mind today?</Text>
                  <View style={styles.starterWrap}>
                    {STARTERS.map((starter) => (
                      <ActionChip key={starter} title={starter} onPress={() => submit(starter)} />
                    ))}
                  </View>
                </View>
              ) : null}
              {crisis ? <CrisisCard /> : null}
            </>
          }
          ListFooterComponent={busy ? <View style={styles.typing}><ActivityIndicator color={colors.primary} /><Text style={typography.caption}>Breathe Companion is typing…</Text></View> : null}
        />

        {error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>Breathe Companion is resting right now. Try again in a minute, or talk to a counsellor.</Text>
            <View style={styles.errorActions}>
              {retryText ? <Button title="Try Again" onPress={() => submit(retryText, true)} loading={busy} /> : null}
              <Button title="Book a counsellor" variant="secondary" onPress={() => router.push("/(student)/sessions")} />
              <Button title="Crisis support" variant="secondary" onPress={() => router.push("/crisis")} />
            </View>
          </Card>
        ) : null}

        <View style={styles.composer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            maxLength={MAX_COMPANION_MESSAGE_LENGTH}
            multiline
            placeholder="Write a message…"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            accessibilityLabel="Message Breathe Companion"
            editable={!busy && messageCount < MAX_COMPANION_MESSAGES - 1}
          />
          <View style={styles.composerBottom}>
            <Text style={styles.counter}>{counterText}</Text>
            <Pressable
              onPress={() => submit()}
              disabled={!canSend}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityState={{ disabled: !canSend, busy }}
              style={[styles.sendButton, !canSend && styles.disabled]}
            >
              <Ionicons name="send" size={20} color={colors.white} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  consentContainer: { flex: 1, padding: spacing.lg, justifyContent: "center", gap: spacing.md },
  headerIcon: { width: 56, height: 56, borderRadius: radius.full, backgroundColor: colors.success, alignItems: "center", justifyContent: "center" },
  consentText: { marginTop: spacing.sm, lineHeight: 24 },
  backButton: { minHeight: TOUCH_TARGET, alignItems: "center", justifyContent: "center" },
  backText: { ...typography.body, color: colors.primary, textDecorationLine: "underline" },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  titleBlock: { flex: 1, gap: 2 },
  clearButton: { minHeight: TOUCH_TARGET, paddingHorizontal: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.xs },
  clearText: { color: colors.primary, fontSize: 13, fontWeight: "600" },
  banner: { marginHorizontal: spacing.lg, padding: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.selected, flexDirection: "row", gap: spacing.xs, alignItems: "center" },
  bannerText: { flex: 1, color: colors.primary, fontSize: 12, lineHeight: 17 },
  listContent: { padding: spacing.lg, paddingBottom: spacing.sm, flexGrow: 1 },
  starterArea: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: spacing.xl },
  welcomeText: { ...typography.body, marginBottom: spacing.md },
  starterWrap: { alignItems: "center", gap: spacing.sm },
  actionChip: { minHeight: TOUCH_TARGET, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.md, justifyContent: "center", backgroundColor: colors.surface },
  actionChipText: { color: colors.primary, fontSize: 14, fontWeight: "600" },
  pressed: { opacity: 0.7 },
  messageRow: { marginBottom: spacing.md, maxWidth: "88%" },
  userRow: { alignSelf: "flex-end", alignItems: "flex-end" },
  modelRow: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: { borderRadius: radius.md, padding: spacing.md },
  userBubble: { backgroundColor: colors.primary, borderBottomRightRadius: radius.sm },
  modelBubble: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: radius.sm },
  bubbleText: { color: colors.white, fontSize: 16, lineHeight: 23 },
  modelBubbleText: { color: colors.text },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  crisisText: { marginVertical: spacing.sm, lineHeight: 23 },
  helpline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: spacing.xs },
  helplineCopy: { flex: 1, gap: 2 },
  helplineName: { ...typography.body, fontWeight: "600" },
  typing: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  errorCard: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderColor: colors.danger, borderWidth: 1 },
  errorText: { ...typography.body, color: colors.danger, lineHeight: 22 },
  errorActions: { gap: spacing.sm, marginTop: spacing.md },
  composer: { borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.sm, paddingHorizontal: spacing.lg, backgroundColor: colors.background },
  input: { minHeight: TOUCH_TARGET, maxHeight: 112, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm, color: colors.text, fontSize: 16 },
  composerBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.xs },
  counter: { ...typography.caption },
  sendButton: { width: TOUCH_TARGET, height: TOUCH_TARGET, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
  disabled: { opacity: 0.45 },
});
