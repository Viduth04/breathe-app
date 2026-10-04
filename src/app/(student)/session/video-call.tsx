import { colors, radius, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { getBooking } from "@/services/bookingService";
import { Booking } from "@/types/booking";
import { ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { StyleSheet, Text, View, Pressable, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VideoCallScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [session, setSession] = useState<Booking | null>(null);
  
    useEffect(() => {
      if (id) {
        getBooking(id).then(data => {
          setSession(data);
        });
      }
    }, [id]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>{session?.counsellorName || "Doctor"}</Text>
            <Text style={styles.headerSubtitle}>Counselor Video Call</Text>
          </View>
        </View>
        <View style={styles.timerPill}>
          <View style={styles.timerDot} />
          <Text style={styles.timerText}>14:35</Text>
        </View>
      </View>

      {/* Main Video Area */}
      <View style={styles.videoContainer}>
        {/* Large Video Feed (Doctor) */}
        <Image 
          source={{ uri: "https://i.pravatar.cc/1000?img=47" }} 
          style={styles.mainVideo} 
          contentFit="cover"
        />

        {/* Top Overlay Pills */}
        <View style={styles.overlayTop}>
          <View style={styles.overlayPillDark}>
            <View style={styles.greenDot} />
            <Text style={styles.overlayText}>{session?.counsellorName || "Doctor"} • Clinical Psychologist</Text>
          </View>
          <View style={styles.overlayPillDark}>
            <Ionicons name="lock-closed-outline" size={14} color="#FFF" />
            <Text style={styles.overlayText}>End-to-End Encrypted</Text>
          </View>
        </View>

        {/* Bottom Left Overlay */}
        <View style={styles.overlayBottomLeft}>
          <View style={styles.overlayPillDark}>
            <Ionicons name="stats-chart" size={14} color="#FFF" />
            <Text style={styles.overlayText}>HD Audio Connected</Text>
          </View>
        </View>

        {/* Small Video Feed (You) */}
        <View style={styles.pipContainer}>
          <Image 
            source={{ uri: "https://i.pravatar.cc/300?img=44" }} 
            style={styles.pipVideo} 
            contentFit="cover"
          />
          <View style={styles.pipTopOverlay}>
            <View style={styles.pipPill}>
              <Text style={styles.pipText}>You</Text>
            </View>
            <View style={styles.pipIconBox}>
              <Ionicons name="mic-off" size={12} color="#FFF" />
            </View>
          </View>
          <View style={styles.pipBottomOverlay}>
            <View style={styles.pipLivePill}>
              <View style={styles.greenDot} />
              <Text style={styles.pipText}>Live</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Controls Bar */}
      <View style={styles.controlsBar}>
        <View style={styles.controlItem}>
          <Pressable style={styles.controlButton}>
            <Ionicons name="mic-outline" size={24} color="#FFF" />
          </Pressable>
          <Text style={styles.controlLabel}>Mute</Text>
        </View>

        <View style={styles.controlItem}>
          <Pressable style={styles.controlButton}>
            <Ionicons name="videocam-outline" size={24} color="#FFF" />
          </Pressable>
          <Text style={styles.controlLabel}>Video</Text>
        </View>

        <View style={styles.controlItem}>
          <Pressable style={styles.controlButton}>
            <Ionicons name="volume-high-outline" size={24} color="#FFF" />
          </Pressable>
          <Text style={styles.controlLabel}>Speaker</Text>
        </View>

        <View style={styles.controlItem}>
          <Pressable style={styles.controlButton}>
            <Ionicons name="chatbubble-outline" size={24} color="#FFF" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1</Text>
            </View>
          </Pressable>
          <Text style={styles.controlLabel}>Chat</Text>
        </View>

        <View style={styles.controlItem}>
          <Pressable style={styles.endButton} onPress={() => router.back()}>
            <Ionicons name="call" size={24} color="#FFF" style={{ transform: [{ rotate: "135deg" }] }} />
          </Pressable>
          <Text style={styles.controlLabel}>End</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  timerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  timerText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  videoContainer: {
    flex: 1,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#000", // Fallback before image loads
    position: "relative",
  },
  mainVideo: {
    width: "100%",
    height: "100%",
  },
  overlayTop: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  overlayPillDark: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(28, 28, 30, 0.75)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    gap: 6,
  },
  overlayText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "500",
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
  },
  overlayBottomLeft: {
    position: "absolute",
    bottom: spacing.md,
    left: spacing.md,
  },
  pipContainer: {
    position: "absolute",
    bottom: spacing.md,
    right: spacing.md,
    width: 100,
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFF",
    backgroundColor: "#333",
  },
  pipVideo: {
    width: "100%",
    height: "100%",
  },
  pipTopOverlay: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pipPill: {
    backgroundColor: "rgba(28, 28, 30, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  pipText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  pipIconBox: {
    backgroundColor: "rgba(28, 28, 30, 0.7)",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pipBottomOverlay: {
    position: "absolute",
    bottom: 8,
    left: 8,
  },
  pipLivePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(28, 28, 30, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  controlsBar: {
    backgroundColor: "#161B22",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 32,
  },
  controlItem: {
    alignItems: "center",
    gap: 6,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  endButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  controlLabel: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "500",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FFF",
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#161B22",
    fontSize: 10,
    fontWeight: "bold",
  },
});
