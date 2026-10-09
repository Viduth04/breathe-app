import { colors, radius, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { getBooking } from "@/services/bookingService";
import { Booking } from "@/types/booking";
import { ActivityIndicator, StyleSheet, Text, View, Pressable, ScrollView, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import { doc, updateDoc, serverTimestamp, deleteField, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";

export default function VideoCallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const callSessionId = (id || "").replace(/^cal-/i, "");
  const [session, setSession] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Listen for the meeting link in real-time
  useEffect(() => {
    if (!callSessionId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "bookings", callSessionId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSession({ id: docSnap.id, ...data } as any);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to booking:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [callSessionId]);

  const handleJoinMeeting = async () => {
    if (session?.meetingLink) {
      setHasJoined(true);
      await Linking.openURL(session.meetingLink);
    }
  };

  const handleMarkCompleted = () => {
    setIsCompleting(true);
    const bookingRef = doc(db, "bookings", callSessionId);
    updateDoc(bookingRef, {
      status: "completed",
      meetingLink: deleteField(),
      updatedAt: serverTimestamp(),
    }).catch(error => console.error("Error marking completed:", error));
    
    // Redirect to review screen immediately
    router.replace({
      pathname: "/(student)/session/review",
      params: { id: callSessionId, counsellorId: session?.counsellorId },
    });
  };

  // Check if session is completed
  const isCompleted = session?.status === "completed" || session?.status === "cancelled";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/(student)/session/dashboard");
          }
        }} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Consultation</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.waitingText}>Connecting...</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="videocam-outline" size={32} color={colors.primary} />
            </View>
            <Text style={styles.title}>External Video Call</Text>
            
            {isCompleted ? (
              <>
                <Text style={styles.subtitleSuccess}>This session has been concluded.</Text>
                <Text style={styles.hint}>The meeting room link is no longer available.</Text>
              </>
            ) : session?.meetingLink ? (
              <>
                <Text style={styles.subtitleSuccess}>
                  Your counsellor has shared the meeting link!
                </Text>

                {/* Main Join Button */}
                <Pressable 
                  style={[styles.primaryBtn, hasJoined && styles.primaryBtnDisabled]} 
                  onPress={hasJoined ? undefined : handleJoinMeeting}
                >
                  <Text style={[styles.primaryBtnText, hasJoined && styles.primaryBtnTextDisabled]}>
                    {hasJoined ? "Joined Meeting Room" : "Join Meeting Room"}
                  </Text>
                  {!hasJoined && <Ionicons name="open-outline" size={20} color="#FFF" />}
                </Pressable>

                {/* Post-join Completion Button */}
                {hasJoined && (
                  <View style={styles.postJoinContainer}>
                    <Text style={styles.postJoinText}>Done with your consultation?</Text>
                    <Pressable 
                      style={styles.secondaryBtn} 
                      onPress={handleMarkCompleted}
                      disabled={isCompleting}
                    >
                      {isCompleting ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Text style={styles.secondaryBtnText}>Mark Meeting as Completed</Text>
                      )}
                    </Pressable>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={styles.subtitle}>
                  Waiting for your counsellor to share the secure meeting link...
                </Text>
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
                <Text style={styles.hint}>
                  This screen will automatically update when the link is available.
                </Text>
              </>
            )}
          </View>
        )}
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
  content: { padding: spacing.md, flexGrow: 1, justifyContent: "center" },
  centerBox: { alignItems: "center", justifyContent: "center" },
  waitingText: { marginTop: spacing.md, color: colors.textSecondary },
  card: {
    backgroundColor: "#FFF",
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
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
    marginBottom: spacing.sm,
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  subtitleSuccess: {
    fontSize: 15,
    color: colors.primary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.lg,
    fontWeight: "500",
  },
  hint: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
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
  },
  primaryBtnDisabled: {
    backgroundColor: "rgba(35,133,109,0.4)",
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  primaryBtnTextDisabled: {
    color: "rgba(255,255,255,0.8)",
  },
  postJoinContainer: {
    marginTop: spacing.xl,
    alignItems: "center",
    width: "100%",
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  postJoinText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  secondaryBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "transparent",
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  }
});
