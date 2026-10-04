// Counsellor Ready to Join (Pre-call Lobby) - Muaath (Member 4). Supports FR07, NFR01, NFR02.
// Encrypted video consultation staging room with hardware toggles and connection telemetry.

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { useCounsellorStore } from "@/services/counsellorStore";
import {
  initLobbySession,
  runTelehealthDiagnostics,
} from "@/services/telehealthVideoService";

export default function ReadyToJoinScreen() {
  const params = useLocalSearchParams<{
    studentAnonId?: string;
    sessionTitle?: string;
    timeRange?: string;
    duration?: string;
    sessionId?: string;
  }>();

  const { callMediaState, toggleMic, toggleCam } = useCounsellorStore();

  const studentAnonId = params.studentAnonId || "Student #4021";
  const sessionTitle = params.sessionTitle || "Encrypted Video Consultation";
  const timeRange = params.timeRange || "02:00 PM – 02:45 PM";
  const duration = params.duration || "45 min session";

  const [diagnosticOpen, setDiagnosticOpen] = useState(false);

  useEffect(() => {
    const roomId = `mnd-${studentAnonId.replace(/[^0-9]/g, "") || "4021"}-sec`;
    const counselorUid = "coun_anjali_01";
    initLobbySession(roomId, counselorUid, "Dr. Anjali Perera", callMediaState).catch(() => {});
  }, [studentAnonId]);

  const handleJoinCall = () => {
    router.navigate({
      pathname: "/(counsellor-detail)/active-video-call",
      params: {
        studentAnonId,
        sessionTitle,
        timeRange,
        sessionId: params.sessionId,
      },
    });
  };

  const runHardwareDiagnostics = async () => {
    const res = await runTelehealthDiagnostics();
    Alert.alert(
      "Clinical AV Diagnostics",
      res.summary,
      [{ text: "Done", style: "default" }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
      {/* ─── Top Header ─── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerCircleBtn}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>

        <Text style={styles.headerTitle} accessibilityRole="header">
          Ready to Join
        </Text>

        <View style={styles.headerCircleBtn}>
          <Ionicons name="shield-checkmark" size={20} color="#059669" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Camera Preview Card ─── */}
        <View style={styles.cameraPreviewCard}>
          {/* Top Left Status Pill */}
          <View style={styles.cameraStatusPill}>
            <View
              style={[
                styles.cameraStatusDot,
                { backgroundColor: callMediaState.camOn ? "#10B981" : "#EF4444" },
              ]}
            />
            <Text style={styles.cameraStatusText}>
              {callMediaState.camOn ? "Camera on" : "Camera off"}
            </Text>
          </View>

          {/* Large Avatar Centerpiece */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Ionicons
                name="person"
                size={52}
                color={callMediaState.camOn ? "#7BBDA7" : "#CBD5E1"}
              />
            </View>
            <View style={styles.camBadge}>
              <Ionicons
                name={callMediaState.camOn ? "videocam" : "videocam-off"}
                size={14}
                color={colors.white}
              />
            </View>
          </View>

          {/* Counselor Name Subtitle */}
          <Text style={styles.counsellorNameText}>
            DR. ANJALI PERERA{" "}
            <Text style={styles.counsellorPreviewHint}>(preview)</Text>
          </Text>

          {/* Mic & Cam Quick Controls */}
          <View style={styles.controlsRow}>
            <Pressable
              style={[
                styles.mediaToggleBtn,
                !callMediaState.micOn && styles.mediaToggleBtnInactive,
              ]}
              onPress={toggleMic}
              accessibilityRole="button"
              accessibilityLabel={callMediaState.micOn ? "Mute mic" : "Unmute mic"}
            >
              <Ionicons
                name={callMediaState.micOn ? "mic" : "mic-off"}
                size={16}
                color={colors.white}
              />
              <Text style={styles.mediaToggleBtnText}>
                {callMediaState.micOn ? "Mic On" : "Mic Muted"}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.mediaToggleBtn,
                !callMediaState.camOn && styles.mediaToggleBtnInactive,
              ]}
              onPress={toggleCam}
              accessibilityRole="button"
              accessibilityLabel={callMediaState.camOn ? "Turn off camera" : "Turn on camera"}
            >
              <Ionicons
                name={callMediaState.camOn ? "videocam" : "videocam-off"}
                size={16}
                color={colors.white}
              />
              <Text style={styles.mediaToggleBtnText}>
                {callMediaState.camOn ? "Cam On" : "Cam Off"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ─── Encrypted & Room Ready Status Row ─── */}
        <View style={styles.statusGridRow}>
          <View style={styles.statusPillBox}>
            <Ionicons name="lock-closed-outline" size={15} color="#475569" />
            <Text style={styles.statusPillText}>End-to-end encrypted</Text>
          </View>

          <View style={styles.statusPillBox}>
            <View style={styles.roomReadyDot} />
            <Text style={styles.roomReadyText}>Room ready</Text>
          </View>
        </View>

        {/* ─── Session Details Card ─── */}
        <View style={styles.sessionCard}>
          <View style={styles.sessionTopRow}>
            <View style={styles.sessionIconBox}>
              <Ionicons name="videocam-outline" size={22} color="#059669" />
            </View>

            <View style={styles.sessionMeta}>
              <Text style={styles.sessionStudentAnon}>{studentAnonId}</Text>
              <Text style={styles.sessionTypeSub}>{sessionTitle}</Text>
            </View>

            <View style={styles.anonymousBadge}>
              <Ionicons name="eye-off-outline" size={13} color="#475569" />
              <Text style={styles.anonymousBadgeText}>Anonymous</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.sessionDivider} />

          {/* Time & Duration */}
          <View style={styles.sessionBottomRow}>
            <View style={styles.timeGroup}>
              <Ionicons name="time-outline" size={16} color="#64748B" />
              <Text style={styles.timeText}>{timeRange}</Text>
            </View>

            <View style={styles.durationPill}>
              <Text style={styles.durationText}>{duration}</Text>
            </View>
          </View>
        </View>

        {/* ─── Network Quality Card ─── */}
        <View style={styles.networkCard}>
          <View style={styles.networkLeft}>
            <View style={styles.wifiCircle}>
              <Ionicons name="wifi" size={16} color="#059669" />
            </View>
            <Text style={styles.networkText}>
              Network:{" "}
              <Text style={styles.networkBold}>Strong clinical connection (HD)</Text>
            </Text>
          </View>

          {/* Signal 4-Bars */}
          <View style={styles.signalBarsContainer}>
            <View style={[styles.signalBar, { height: 6 }]} />
            <View style={[styles.signalBar, { height: 10 }]} />
            <View style={[styles.signalBar, { height: 14 }]} />
            <View style={[styles.signalBar, { height: 18 }]} />
          </View>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1, minHeight: 32 }} />

        {/* ─── Join Now CTA ─── */}
        <Pressable
          style={styles.joinNowBtn}
          onPress={handleJoinCall}
          accessibilityRole="button"
          accessibilityLabel="Join Now"
        >
          <Ionicons name="call" size={18} color={colors.white} />
          <Text style={styles.joinNowBtnText}>Join Now</Text>
        </Pressable>

        {/* ─── Diagnostics Link ─── */}
        <Pressable
          style={styles.diagnosticBtn}
          onPress={runHardwareDiagnostics}
          accessibilityRole="button"
          accessibilityLabel="Test mic and camera settings"
        >
          <Ionicons name="options-outline" size={16} color="#64748B" />
          <Text style={styles.diagnosticBtnText}>
            Test mic & camera settings
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF8E7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  cameraPreviewCard: {
    backgroundColor: "#E6F7F0",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#CCF0E1",
    paddingVertical: 24,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    position: "relative",
  },
  cameraStatusPill: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  cameraStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cameraStatusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1F2937",
  },
  avatarWrapper: {
    position: "relative",
    marginTop: 10,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: "#C6E7DC",
    justifyContent: "center",
    alignItems: "center",
  },
  camBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#047857",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  counsellorNameText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "#065F46",
    marginTop: 14,
    marginBottom: 16,
  },
  counsellorPreviewHint: {
    fontWeight: "400",
    color: "#047857",
  },
  controlsRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  mediaToggleBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 22,
    height: 44,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mediaToggleBtnInactive: {
    backgroundColor: "#475569",
  },
  mediaToggleBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.white,
  },
  statusGridRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: spacing.md,
  },
  statusPillBox: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 10,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
  },
  roomReadyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  roomReadyText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
  sessionCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sessionTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sessionMeta: {
    flex: 1,
  },
  sessionStudentAnon: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
  },
  sessionTypeSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  anonymousBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  anonymousBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  sessionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginVertical: 12,
  },
  sessionBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
  },
  durationPill: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
  },
  networkCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  networkLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  wifiCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  networkText: {
    fontSize: 12,
    color: "#475569",
  },
  networkBold: {
    fontWeight: "700",
    color: "#1F2937",
  },
  signalBarsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    paddingRight: 4,
  },
  signalBar: {
    width: 3.5,
    borderRadius: 2,
    backgroundColor: "#059669",
  },
  joinNowBtn: {
    backgroundColor: "#064E3B",
    borderRadius: 14,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: spacing.xs,
  },
  joinNowBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
  diagnosticBtn: {
    height: TOUCH_TARGET,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  diagnosticBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
});
