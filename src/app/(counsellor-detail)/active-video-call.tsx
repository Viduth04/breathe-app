// Counsellor Active Video Call - Muaath (Member 4). Supports FR07, NFR01, NFR02.
// Simulated live encrypted video consultation with privacy shield, audio waveform, self-view PiP, and call controls.

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { useCounsellorStore } from "@/services/counsellorStore";

export default function ActiveVideoCallScreen() {
  const params = useLocalSearchParams<{
    studentAnonId?: string;
    sessionTitle?: string;
  }>();

  const studentAnonId = params.studentAnonId || "Student #4021";

  const {
    callMediaState,
    toggleMic,
    toggleCam,
    completeSession,
  } = useCounsellorStore();

  // Call timer: starting at 12:34 (754 seconds) as in Figma mockup, counting up
  const [seconds, setSeconds] = useState(754);
  const [waveformHeights, setWaveformHeights] = useState([8, 14, 22, 16, 24, 18, 10]);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState(
    "Student reports academic deadline anxiety. Practicing 4-7-8 breathing technique."
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Animate audio waveform bars gently to simulate live student speech
  useEffect(() => {
    const waveInterval = setInterval(() => {
      setWaveformHeights([
        6 + Math.floor(Math.random() * 8),
        10 + Math.floor(Math.random() * 12),
        14 + Math.floor(Math.random() * 14),
        12 + Math.floor(Math.random() * 16),
        16 + Math.floor(Math.random() * 12),
        10 + Math.floor(Math.random() * 10),
        6 + Math.floor(Math.random() * 8),
      ]);
    }, 300);
    return () => clearInterval(waveInterval);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndCall = () => {
    Alert.alert(
      "End Consultation",
      `Are you sure you want to end this encrypted session with ${studentAnonId}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Session",
          style: "destructive",
          onPress: () => {
            completeSession("session-1");
            router.navigate({
              pathname: "/(counsellor)/dashboard",
              params: { sessionCompleted: "true" },
            });
          },
        },
      ]
    );
  };

  const handleOpenChat = () => {
    router.navigate({
      pathname: "/(counsellor)/messages",
      params: { studentAnonId, fromCall: "true" },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
      {/* ─── Top Status Bar Header ─── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.minimizeBtn}
          accessibilityLabel="Minimize call"
          accessibilityRole="button"
          hitSlop={8}
        >
          <Ionicons name="chevron-down" size={20} color="#E2E8F0" />
        </Pressable>

        <View style={styles.headerBadgesRow}>
          {/* Encrypted Badge */}
          <View style={styles.encryptedPill}>
            <Ionicons name="lock-closed" size={11} color="#A7F3D0" />
            <Text style={styles.encryptedText}>Encrypted</Text>
          </View>

          {/* Live Timer Badge */}
          <View style={styles.timerPill}>
            <View style={styles.redPulseDot} />
            <Text style={styles.timerText}>{formatTimer(seconds)}</Text>
          </View>

          {/* Signal Indicator */}
          <View style={styles.signalPill}>
            <Ionicons name="cellular" size={13} color="#10B981" />
          </View>
        </View>
      </View>

      {/* ─── Client Info Row ─── */}
      <View style={styles.clientRow}>
        <Text style={styles.clientText}>
          Client:{" "}
          <Text style={styles.clientAnon}>{studentAnonId} - Anonymous</Text>
        </Text>
        <Text style={styles.safeChannelText}>SafeChannel™</Text>
      </View>

      {/* ─── Main Video Stage ─── */}
      <View style={styles.videoStageContainer}>
        <View style={styles.dashedStageBox}>
          {/* Privacy Shield Squircle */}
          <View style={styles.shieldEmblemContainer}>
            <View style={styles.shieldEmblemBox}>
              <Ionicons name="shield-outline" size={44} color="#6EE7B7" />
              <View style={styles.shieldInnerPerson}>
                <Ionicons name="person-outline" size={22} color="#6EE7B7" />
              </View>
            </View>

            {/* Mic Badge on Shield */}
            <View style={styles.shieldMicBadge}>
              <Ionicons name="mic" size={13} color={colors.white} />
            </View>
          </View>

          {/* Privacy Status Pill */}
          <View style={styles.privacyModePill}>
            <Ionicons name="eye-off-outline" size={14} color="#E2E8F0" />
            <Text style={styles.privacyModeText}>
              Video Hidden — Anonymous Mode
            </Text>
          </View>

          {/* Privacy Description */}
          <Text style={styles.privacyDescText}>
            Microphone active • Encrypted audio{"\n"}transmission only
          </Text>

          {/* Live Audio Waveform Bars */}
          <View style={styles.waveformContainer}>
            {waveformHeights.map((h, i) => (
              <View
                key={i}
                style={[styles.waveformBar, { height: h }]}
              />
            ))}
          </View>

          <Text style={styles.waveformLabel}>LIVE AUDIO WAVEFORM</Text>

          {/* ─── Floating PiP Self-View ─── */}
          <View style={styles.pipCard}>
            <View style={styles.pipTopRow}>
              <Text style={styles.pipLabel}>PIP</Text>
              <View style={styles.pipLiveBadge}>
                <View style={styles.pipLiveDot} />
                <Text style={styles.pipLiveText}>LIVE</Text>
              </View>
            </View>

            <View style={styles.pipCenter}>
              <View style={styles.pipAvatarSquare}>
                <Ionicons
                  name={callMediaState.camOn ? "person" : "videocam-off"}
                  size={24}
                  color="#A7F3D0"
                />
              </View>
              <Text style={styles.pipName}>Dr. A. Perera</Text>
              <Text style={styles.pipYou}>(You)</Text>
            </View>

            <View style={styles.pipBottomRow}>
              <Ionicons
                name={callMediaState.micOn ? "mic" : "mic-off"}
                size={12}
                color={callMediaState.micOn ? "#34D399" : "#EF4444"}
              />
              <Text style={styles.pipSelfView}>Self View</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ─── Bottom Call Control Dock ─── */}
      <View style={styles.controlDock}>
        {/* Mute Button */}
        <View style={styles.dockItem}>
          <Pressable
            style={[
              styles.dockBtn,
              !callMediaState.micOn && styles.dockBtnMuted,
            ]}
            onPress={toggleMic}
            accessibilityRole="button"
            accessibilityLabel={callMediaState.micOn ? "Mute" : "Unmute"}
          >
            <Ionicons
              name={callMediaState.micOn ? "mic-outline" : "mic-off"}
              size={22}
              color={callMediaState.micOn ? "#065F46" : "#EF4444"}
            />
          </Pressable>
          <Text style={styles.dockLabel}>
            {callMediaState.micOn ? "Mute" : "Unmute"}
          </Text>
        </View>

        {/* Video Button */}
        <View style={styles.dockItem}>
          <Pressable
            style={[
              styles.dockBtn,
              !callMediaState.camOn && styles.dockBtnMuted,
            ]}
            onPress={toggleCam}
            accessibilityRole="button"
            accessibilityLabel={callMediaState.camOn ? "Turn Video Off" : "Turn Video On"}
          >
            <Ionicons
              name={callMediaState.camOn ? "videocam-outline" : "videocam-off"}
              size={22}
              color={callMediaState.camOn ? "#065F46" : "#EF4444"}
            />
          </Pressable>
          <Text style={styles.dockLabel}>Video</Text>
        </View>

        {/* Chat Button */}
        <View style={styles.dockItem}>
          <Pressable
            style={styles.dockBtn}
            onPress={handleOpenChat}
            accessibilityRole="button"
            accessibilityLabel="Chat with Student"
          >
            <Ionicons name="chatbubbles-outline" size={22} color="#065F46" />
            <View style={styles.chatBadgeDot} />
          </Pressable>
          <Text style={styles.dockLabel}>Chat</Text>
        </View>

        {/* Notes Button */}
        <View style={styles.dockItem}>
          <Pressable
            style={styles.dockBtn}
            onPress={() => setNotesModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Clinical Notes"
          >
            <Ionicons name="document-text-outline" size={22} color="#065F46" />
          </Pressable>
          <Text style={styles.dockLabel}>Notes</Text>
        </View>

        {/* End Call Button */}
        <View style={styles.dockItem}>
          <Pressable
            style={styles.endCallBtn}
            onPress={handleEndCall}
            accessibilityRole="button"
            accessibilityLabel="End Call"
          >
            <Ionicons
              name="call"
              size={22}
              color={colors.white}
              style={{ transform: [{ rotate: "135deg" }] }}
            />
          </Pressable>
          <Text style={styles.endCallLabel}>End Call</Text>
        </View>
      </View>

      {/* ─── In-Call Clinical Notes Modal ─── */}
      <Modal
        visible={notesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNotesModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Confidential Case Notes</Text>
                <Text style={styles.modalSubtitle}>
                  {studentAnonId} • SafeChannel™ Encrypted
                </Text>
              </View>
              <Pressable
                onPress={() => setNotesModalVisible(false)}
                style={styles.modalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Close notes"
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </Pressable>
            </View>

            <TextInput
              style={styles.modalNotesInput}
              multiline
              value={clinicalNotes}
              onChangeText={setClinicalNotes}
              placeholder="Record observations, grounding techniques, or intervention plan..."
              placeholderTextColor="#94A3B8"
              textAlignVertical="top"
            />

            <Pressable
              style={styles.saveNotesBtn}
              onPress={() => setNotesModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Save Notes"
            >
              <Text style={styles.saveNotesBtnText}>Save to Private Log</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0D2820",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  minimizeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  encryptedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#13382D",
    borderWidth: 1,
    borderColor: "#1D4D3E",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  encryptedText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A7F3D0",
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#13382D",
    borderWidth: 1,
    borderColor: "#1D4D3E",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  redPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#EF4444",
  },
  timerText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
  },
  signalPill: {
    backgroundColor: "#13382D",
    borderWidth: 1,
    borderColor: "#1D4D3E",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  clientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: 4,
    paddingBottom: spacing.sm,
  },
  clientText: {
    fontSize: 13,
    color: "#94A3B8",
  },
  clientAnon: {
    fontWeight: "700",
    color: colors.white,
  },
  safeChannelText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#34D399",
  },
  videoStageContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  dashedStageBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#1D4D3E",
    borderStyle: "dashed",
    borderRadius: 24,
    padding: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  shieldEmblemContainer: {
    position: "relative",
    marginBottom: 16,
  },
  shieldEmblemBox: {
    width: 100,
    height: 100,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#34D399",
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  shieldInnerPerson: {
    position: "absolute",
  },
  shieldMicBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0D2820",
  },
  privacyModePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(6, 78, 59, 0.4)",
    borderWidth: 1,
    borderColor: "#1D4D3E",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 8,
  },
  privacyModeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#F1F5F9",
  },
  privacyDescText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    color: "#A7F3D0",
    marginBottom: 14,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginBottom: 6,
  },
  waveformBar: {
    width: 3.5,
    borderRadius: 2,
    backgroundColor: "#34D399",
  },
  waveformLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#6EE7B7",
  },
  pipCard: {
    position: "absolute",
    bottom: 14,
    right: 14,
    width: 122,
    height: 156,
    borderRadius: 16,
    backgroundColor: "#14352B",
    borderWidth: 1,
    borderColor: "#235A4A",
    padding: 8,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  pipTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pipLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94A3B8",
  },
  pipLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pipLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#34D399",
  },
  pipLiveText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#34D399",
  },
  pipCenter: {
    alignItems: "center",
  },
  pipAvatarSquare: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#34D399",
    borderStyle: "dashed",
    backgroundColor: "rgba(52, 211, 153, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  pipName: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.white,
    textAlign: "center",
  },
  pipYou: {
    fontSize: 9,
    color: "#94A3B8",
    textAlign: "center",
  },
  pipBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pipSelfView: {
    fontSize: 9,
    fontWeight: "600",
    color: "#CBD5E1",
  },
  controlDock: {
    backgroundColor: "#FFF8EC",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.md,
    paddingTop: 14,
    paddingBottom: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dockItem: {
    alignItems: "center",
    gap: 4,
  },
  dockBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F3ECE0",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  dockBtnMuted: {
    backgroundColor: "#FEE2E2",
  },
  dockLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
  },
  chatBadgeDot: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#059669",
    borderWidth: 1.5,
    borderColor: "#FFF8EC",
  },
  endCallBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  endCallLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  modalNotesInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 12,
    minHeight: 120,
    fontSize: 14,
    color: "#1F2937",
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  saveNotesBtn: {
    backgroundColor: "#064E3B",
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  saveNotesBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
});
