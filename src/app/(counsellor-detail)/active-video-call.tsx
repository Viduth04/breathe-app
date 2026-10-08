import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Alert, TextInput, ScrollView , Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { colors, radius, spacing, typography } from "@/theme";
import { useCounsellorStore } from "@/services/counsellorStore";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/config";

export default function ActiveVideoCallScreen() {
  const params = useLocalSearchParams<{
    studentAnonId?: string;
    sessionTitle?: string;
    sessionId?: string;
  }>();

  const studentAnonId = params.studentAnonId || "Student #4021";
  const callSessionId = (params.sessionId || "").replace(/^cal-/i, "");

  const { completeSession } = useCounsellorStore();
  const [meetingLink, setMeetingLink] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleStartExternalMeeting = async () => {
    if (!meetingLink.trim()) {
      Alert.alert("Link Required", "Please enter a valid Google Meet or Zoom link.");
      return;
    }
    
    setIsSaving(true);
    try {
      if (callSessionId) {
        // Save link for student to see
        await updateDoc(doc(db, "bookings", callSessionId), {
          meetingLink: meetingLink.trim(),
          updatedAt: serverTimestamp(),
        });
      }
      
      // Open the meeting
      await Linking.openURL(meetingLink.trim());
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not save meeting link.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEndSession = async () => {
    try {
      if (callSessionId) {
        await completeSession(callSessionId);
      }
      Alert.alert("Session Ended", "The session has been marked as completed.");
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not end session.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Manual Video Session</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="link-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>External Video Call</Text>
          <Text style={styles.subtitle}>
            To keep this session private and secure without complex third-party tools, please generate a Google Meet or Zoom link and share it below with {studentAnonId}.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g., https://meet.google.com/abc-defg-hij"
            placeholderTextColor={colors.textSecondary}
            value={meetingLink}
            onChangeText={setMeetingLink}
            autoCapitalize="none"
            keyboardType="url"
          />

          <Pressable 
            style={[styles.primaryBtn, (!meetingLink.trim() || isSaving) && styles.disabledBtn]} 
            onPress={handleStartExternalMeeting}
            disabled={!meetingLink.trim() || isSaving}
          >
            <Ionicons name="videocam-outline" size={20} color="#FFF" />
            <Text style={styles.primaryBtnText}>
              {isSaving ? "Saving..." : "Share Link & Join"}
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={handleEndSession}>
            <Text style={styles.secondaryBtnText}>Mark Session as Completed</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  iconBtn: { padding: spacing.xs },
  headerTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  content: { padding: spacing.md },
  card: {
    backgroundColor: "#FFF",
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(35,133,109,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading,
    marginBottom: spacing.xs,
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  input: {
    width: "100%",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  primaryBtn: {
    width: "100%",
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: spacing.md,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  secondaryBtn: {
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
});
