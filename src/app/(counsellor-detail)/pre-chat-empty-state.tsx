// Counsellor Pre-Chat Empty State / Waiting Room - Muaath (Member 4). Supports FR07, NFR01, NFR02.
// Clinical student waiting room with intake brief, clinical prompts, and privacy-first opening dock.

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { useCounsellorStore } from "@/services/counsellorStore";
import { MOCK_PRE_CHAT_WAITING_ROOM } from "@/services/mockDetailScreensData";
import { ClinicalPromptItem } from "@/types/counsellorDetailScreens";

export default function PreChatEmptyStateScreen() {
  const params = useLocalSearchParams<{
    studentAnonId?: string;
    studentId?: string;
    fromAcceptance?: string;
  }>();

  const { sendOpeningMessage } = useCounsellorStore();

  const studentAnonId =
    params.studentAnonId || MOCK_PRE_CHAT_WAITING_ROOM.studentAnonId;
  const [inputText, setInputText] = useState("");
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  const handleSendPrompt = (promptText: string) => {
    setInputText(promptText);
  };

  const handleSendMessage = (textToSend?: string) => {
    const message = (textToSend || inputText).trim();
    if (!message) return;

    sendOpeningMessage(studentAnonId, message);

    router.replace({
      pathname: "/(counsellor)/messages",
      params: { studentAnonId },
    });
  };

  const handleToolAction = (toolName: string) => {
    if (toolName === "Breathing Technique") {
      setInputText(
        "I’ve prepared a 4-7-8 calming breath guide for us to try whenever you're ready."
      );
    } else if (toolName === "Grounding Exercise") {
      setInputText(
        "Let's try a 5-4-3-2-1 sensory grounding exercise to help settle any exam tension."
      );
    } else if (toolName === "Intake Chart") {
      Alert.alert(
        "Intake Screener",
        `Student: ${studentAnonId}\nPHQ-9 Score: 14 (Moderate Anxiety & Exam Strain)\nStatus: Shared confidentially.`
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* ─── Top Navigation Header ─── */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.headerSquareBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back to dashboard"
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={20} color="#1E293B" />
          </Pressable>

          {/* Student Profile Block */}
          <View style={styles.headerStudentBlock}>
            <View style={styles.headerAvatarContainer}>
              <Ionicons name="person" size={22} color="#065F46" />
              {/* Micro Shield Badge */}
              <View style={styles.microShieldBadge}>
                <Ionicons name="shield-checkmark" size={10} color="#065F46" />
              </View>
              {/* Active Dot */}
              <View style={styles.activeConnectionDot} />
            </View>

            <View style={styles.headerStudentMeta}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerStudentName} numberOfLines={1}>
                  {studentAnonId}
                </Text>
                <Ionicons name="shield-checkmark" size={14} color="#065F46" />
              </View>
              <Text style={styles.headerSubtitle}>Scheduled: Today, 11:00 AM</Text>
            </View>
          </View>

          {/* Info Action Target */}
          <Pressable
            onPress={() =>
              Alert.alert(
                "Session Details",
                `Patient: ${studentAnonId}\nModality: Secure Anonymous Video / Chat Consultation\nStandard Duration: 45 min\nEncryption: End-to-end verified.`
              )
            }
            style={styles.headerSquareBtn}
            accessibilityRole="button"
            accessibilityLabel="Session details and student clinical history"
            hitSlop={8}
          >
            <Ionicons name="information-circle-outline" size={22} color="#1E293B" />
          </Pressable>
        </View>

        {/* ─── Security Strip ─── */}
        <View style={styles.securityStrip}>
          <Ionicons name="lock-closed" size={13} color="#475569" />
          <Text style={styles.securityStripText}>
            PRIVATE & ENCRYPTED • HEALTHCARE PRIVACY STANDARDS
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Status Capsule Pill */}
          <View style={styles.statusPillContainer}>
            <View style={styles.statusCapsulePill}>
              <View style={styles.statusGreenDot} />
              <Text style={styles.statusCapsuleText}>
                Today, Monday 18 Aug • Intake Room Ready
              </Text>
            </View>
          </View>

          {/* Confidential Student Intake Card */}
          <View style={styles.intakeCard}>
            <View style={styles.intakeIconBox}>
              <Ionicons name="shield-checkmark" size={20} color="#065F46" />
            </View>
            <View style={styles.intakeContent}>
              <View style={styles.intakeHeaderRow}>
                <Text style={styles.intakeTitle}>Confidential Student Intake</Text>
                <View style={styles.intakeIdPill}>
                  <Text style={styles.intakeIdText}>{studentAnonId}</Text>
                </View>
              </View>
              <Text style={styles.intakeBody}>
                Anonymous mode active. Student has submitted pre-session check-in form{" "}
                <Text style={styles.intakeBold}>(PHQ-9 score: 14</Text>, Primary concern:{" "}
                <Text style={styles.intakeBold}>Exam Stress & Insomnia</Text>).
              </Text>
            </View>
          </View>

          {/* Hero Waiting Room Visual */}
          <View style={styles.heroSection}>
            <View style={styles.radarOuterRing}>
              <View style={styles.avatarMainCircle}>
                <Ionicons name="person" size={44} color="#065F46" />
                <View style={styles.avatarShieldBadge}>
                  <Ionicons name="shield-checkmark" size={12} color={colors.white} />
                </View>
              </View>
            </View>

            <Text style={styles.heroTitle}>{studentAnonId} is in the Waiting Room</Text>
            <Text style={styles.heroSubtitle}>
              Session booked for 45 minutes. Student is ready to connect.
            </Text>

            {/* Student Shared Context Box */}
            <View style={styles.sharedContextCard}>
              <View style={styles.contextHeader}>
                <Ionicons name="chatbubble-ellipses" size={14} color="#065F46" />
                <Text style={styles.contextHeaderText}>STUDENT SHARED CONTEXT</Text>
              </View>
              <View style={styles.quoteBorder}>
                <Text style={styles.quoteText}>
                  “Feeling overwhelmed with upcoming mid-term finals and having trouble concentrating.”
                </Text>
              </View>
            </View>
          </View>

          {/* Clinical Opening Prompts */}
          <View style={styles.promptsSection}>
            <Text style={styles.promptsHint}>
              Select a clinical starter below or compose an opening message.
            </Text>

            <View style={styles.promptsHeaderRow}>
              <Text style={styles.promptsTitle}>CLINICAL OPENING PROMPTS</Text>
              <View style={styles.fastSendBadge}>
                <Text style={styles.fastSendText}>Fast Send</Text>
              </View>
            </View>

            {MOCK_PRE_CHAT_WAITING_ROOM.openingPrompts.map((prompt: ClinicalPromptItem) => (
              <Pressable
                key={prompt.id}
                style={styles.promptCard}
                onPress={() => handleSendPrompt(prompt.promptText)}
                accessibilityRole="button"
                accessibilityLabel={prompt.promptText}
              >
                <View style={styles.promptIconBox}>
                  <Ionicons
                    name={prompt.iconName as any}
                    size={16}
                    color="#065F46"
                  />
                </View>
                <Text style={styles.promptText}>{prompt.promptText}</Text>
                <Ionicons name="chevron-forward" size={16} color="#64748B" />
              </Pressable>
            ))}
          </View>

          {/* Navigation link to view other requests */}
          <View style={styles.altNavRow}>
            <Pressable
              onPress={() => router.navigate("/(counsellor)/dashboard")}
              style={styles.altNavBtn}
              accessibilityRole="button"
              accessibilityLabel="View Pending Requests on Dashboard"
            >
              <Ionicons name="arrow-back-outline" size={14} color="#065F46" />
              <Text style={styles.altNavText}>View Dashboard Requests</Text>
            </Pressable>
          </View>

          <View style={{ height: 140 }} />
        </ScrollView>

        {/* ─── Bottom Fixed Dock ─── */}
        <View style={styles.bottomDock}>
          {/* Quick Action Tool Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.toolPillsScroll}
          >
            <Pressable
              style={styles.toolPill}
              onPress={() => handleToolAction("Breathing Technique")}
              accessibilityRole="button"
              accessibilityLabel="Add Breathing Technique"
            >
              <Ionicons name="reorder-four-outline" size={14} color="#065F46" />
              <Text style={styles.toolPillText}>+ Breathing Technique</Text>
            </Pressable>

            <Pressable
              style={styles.toolPill}
              onPress={() => handleToolAction("Grounding Exercise")}
              accessibilityRole="button"
              accessibilityLabel="Add Grounding Exercise"
            >
              <Ionicons name="triangle-outline" size={14} color="#065F46" />
              <Text style={styles.toolPillText}>+ Grounding Exercise</Text>
            </Pressable>

            <Pressable
              style={styles.toolPill}
              onPress={() => handleToolAction("Intake Chart")}
              accessibilityRole="button"
              accessibilityLabel="View Intake Chart"
            >
              <Ionicons name="calendar-outline" size={14} color="#065F46" />
              <Text style={styles.toolPillText}>+ Intake Chart</Text>
            </Pressable>
          </ScrollView>

          {/* Main Input Bar */}
          <View style={styles.inputRow}>
            <Pressable
              style={styles.attachBtn}
              onPress={() =>
                Alert.alert("Clinical Attachments", "Select assessment guide, coping PDF, or clinical referral.")
              }
              accessibilityRole="button"
              accessibilityLabel="Add clinical resource or attachment"
            >
              <Ionicons name="add" size={20} color="#1E293B" />
            </Pressable>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.chatInput}
                placeholder={`Type an opening message to ${studentAnonId}...`}
                placeholderTextColor="#64748B"
                value={inputText}
                onChangeText={setInputText}
              />
              <Pressable
                style={styles.micBtn}
                onPress={() => Alert.alert("Voice Dictation", "Clinical voice dictation active.")}
                accessibilityRole="button"
                accessibilityLabel="Dictate message with voice"
              >
                <Ionicons name="mic-outline" size={18} color="#64748B" />
              </Pressable>
            </View>

            <Pressable
              style={[
                styles.sendBtn,
                !inputText.trim() && { opacity: 0.8 },
              ]}
              onPress={() => handleSendMessage()}
              accessibilityRole="button"
              accessibilityLabel="Send opening message to student"
            >
              <Ionicons name="arrow-up" size={20} color={colors.white} />
            </Pressable>
          </View>

          {/* Compliance Statement Micro-footer */}
          <View style={styles.dockCompliance}>
            <Ionicons name="lock-closed" size={11} color="#64748B" />
            <Text style={styles.dockComplianceText}>
              Confidential & HIPAA / FERPA compliant • End-to-end encrypted
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF8E7",
  },
  header: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "#E6EFE9",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerSquareBtn: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E6EFE9",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerStudentBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    gap: 10,
  },
  headerAvatarContainer: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: 16,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  microShieldBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: "#E6EFE9",
  },
  activeConnectionDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#10B981",
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  headerStudentMeta: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  headerStudentName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  securityStrip: {
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  securityStripText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
    letterSpacing: 0.4,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  statusPillContainer: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  statusCapsulePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(167, 243, 208, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(167, 243, 208, 0.8)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#065F46",
  },
  statusCapsuleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#064E3B",
  },
  intakeCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6EFE9",
    padding: spacing.md,
    flexDirection: "row",
    gap: 12,
    marginBottom: spacing.md,
    shadowColor: "#065F46",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  intakeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "rgba(167, 243, 208, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  intakeContent: {
    flex: 1,
  },
  intakeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  intakeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  intakeIdPill: {
    backgroundColor: "rgba(167, 243, 208, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(167, 243, 208, 0.7)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  intakeIdText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#064E3B",
  },
  intakeBody: {
    fontSize: 12,
    lineHeight: 18,
    color: "#475569",
  },
  intakeBold: {
    fontWeight: "700",
    color: "#1E293B",
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  radarOuterRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "rgba(167, 243, 208, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarMainCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: "#A7F3D0",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarShieldBadge: {
    position: "absolute",
    bottom: 4,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#065F46",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    maxWidth: 280,
    marginBottom: spacing.md,
  },
  sharedContextCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6EFE9",
    padding: spacing.md,
  },
  contextHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  contextHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "#065F46",
  },
  quoteBorder: {
    borderLeftWidth: 2.5,
    borderLeftColor: "#A7F3D0",
    paddingLeft: 10,
  },
  quoteText: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: "italic",
    color: "#1E293B",
  },
  promptsSection: {
    marginBottom: spacing.md,
  },
  promptsHint: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 10,
  },
  promptsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  promptsTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#64748B",
  },
  fastSendBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  fastSendText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#065F46",
  },
  promptCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6EFE9",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
    shadowColor: "#065F46",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  promptIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  promptText: {
    flex: 1,
    fontSize: 12.5,
    color: "#1E293B",
    lineHeight: 18,
    fontWeight: "500",
  },
  altNavRow: {
    alignItems: "center",
    marginTop: spacing.xs,
  },
  altNavBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  altNavText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#065F46",
  },
  bottomDock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderTopWidth: 1,
    borderTopColor: "#E6EFE9",
    paddingTop: 10,
    paddingBottom: 22,
    paddingHorizontal: spacing.md,
    shadowColor: "#065F46",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  toolPillsScroll: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 8,
  },
  toolPill: {
    height: TOUCH_TARGET,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  toolPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#064E3B",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  attachBtn: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: 16,
    backgroundColor: "#F5F5F4",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    justifyContent: "center",
    alignItems: "center",
  },
  inputWrapper: {
    flex: 1,
    height: TOUCH_TARGET,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  chatInput: {
    flex: 1,
    fontSize: 13,
    color: "#1E293B",
    paddingVertical: 0,
  },
  micBtn: {
    padding: 4,
  },
  sendBtn: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: 16,
    backgroundColor: "#065F46",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#065F46",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  dockCompliance: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 8,
  },
  dockComplianceText: {
    fontSize: 10.5,
    fontWeight: "500",
    color: "#64748B",
  },
});
