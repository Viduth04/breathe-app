import { FLOATING_HELP_CLEARANCE } from "@/components/crisis/UrgentHelpLink";
import { colors, radius, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { getBooking } from "@/services/bookingService";
import { Booking } from "@/types/booking";
import { ActivityIndicator, StyleSheet, Text, View, Pressable, StatusBar, Modal, TextInput, Platform } from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import React from "react";
import { getCounsellorPhoto } from "@/services/counsellorPhotoService";
import { db } from "@/firebase/config";
import { collection, addDoc } from "firebase/firestore";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function VideoCallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<Booking | null>(null);
  const [counsellorPhoto, setCounsellorPhoto] = useState<string | null>(null);
  const [counsellorName, setCounsellorName] = useState("Doctor");
  const [seconds, setSeconds] = useState(0);
  const { profile } = useAuth();
  
  // Review Modal State
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  
  useEffect(() => {
    if (id) {
      getBooking(id).then(data => {
        setSession(data);
        if (data?.counsellorId) {
          getCounsellorPhoto(data.counsellorId).then(photo => {
            setCounsellorPhoto(photo);
          });
        }
      });
    }
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleEndCall = () => {
    setShowReview(true);
  };

  const finishSession = () => {
    setShowReview(false);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/(student)/session/dashboard");
    }
  };

  const submitReview = async () => {
    try {
      if (session?.counsellorId) {
        await addDoc(collection(db, "counsellorReviews"), {
          counsellorId: session.counsellorId,
          studentId: profile?.uid || "Anonymous",
          rating,
          feedback,
          createdAt: new Date(),
        });
      }
    } catch (e) {
      console.warn("Failed to submit review", e);
    }
    setSubmitted(true);
    setTimeout(() => {
      finishSession();
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={handleEndCall} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>{counsellorName}</Text>
            <Text style={styles.headerSubtitle}>Counselor Video Call</Text>
          </View>
        </View>
        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>{formatTime(seconds)}</Text>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        
        {/* Telehealth Launch UI */}
          <View style={[styles.mainVideoContainer, { backgroundColor: '#1F2937', marginBottom: 20, alignItems: 'center', justifyContent: 'center', padding: 20 }]}>
            {counsellorPhoto ? (
              <Image source={{ uri: counsellorPhoto }} style={{ width: 120, height: 120, borderRadius: 60, marginBottom: 20 }} />
            ) : (
              <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Ionicons name="person" size={60} color="#9CA3AF" />
              </View>
            )}
            
            <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
              Consultation Ready
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginBottom: 30 }}>
              Your secure video room has been generated. Launch the room to connect with {counsellorName}.
            </Text>

            <Pressable 
              style={{ backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: radius.full, flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'center' }}
              onPress={async () => {
                const url = `https://meet.jit.si/BreatheApp_Consultation_${id || 'demo'}#config.prejoinPageEnabled=false&userInfo.displayName="Student"`;
                if (Platform.OS === 'web') {
                  window.open(url, '_blank');
                } else {
                  await WebBrowser.openBrowserAsync(url);
                }
              }}
            >
              <Ionicons name="videocam" size={24} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>Enter Video Room</Text>
            </Pressable>
          </View>
        </View>

        {/* Review Modal */}
      <Modal visible={showReview} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {submitted ? (
              <View style={styles.successView}>
                <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
                <Text style={styles.successTitle}>Review Submitted!</Text>
                <Text style={styles.successText}>Thank you for your feedback.</Text>
              </View>
            ) : (
              <>
                <Text style={styles.modalTitle}>Rate your session</Text>
                <Text style={styles.modalSubtitle}>How was your consultation with {counsellorName}?</Text>
                
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable key={star} onPress={() => setRating(star)}>
                      <Ionicons 
                        name={rating >= star ? "star" : "star-outline"} 
                        size={40} 
                        color={rating >= star ? "#F59E0B" : "#D1D5DB"} 
                        style={styles.starIcon}
                      />
                    </Pressable>
                  ))}
                </View>

                <TextInput
                  style={styles.feedbackInput}
                  placeholder="Share your experience (optional)..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  value={feedback}
                  onChangeText={setFeedback}
                />

                <Pressable 
                  style={[styles.submitButton, rating === 0 && { opacity: 0.5 }]} 
                  onPress={submitReview}
                  disabled={rating === 0}
                >
                  <Text style={styles.submitButtonText}>Submit Review</Text>
                </Pressable>

                <Pressable style={styles.skipButton} onPress={finishSession}>
                  <Text style={styles.skipButtonText}>Skip for now</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    // Keeps the right-hand icon clear of the floating crisis help button
    paddingRight: FLOATING_HELP_CLEARANCE,
    paddingVertical: spacing.md,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timerBadge: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  timerText: {
    color: colors.danger,
    fontWeight: "bold",
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  mainVideoContainer: {
    flex: 1,
    backgroundColor: "#1F2937",
    borderRadius: radius.xl,
    overflow: "hidden",
    position: "relative",
  },
  mainVideoImage: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayTop: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  overlayBottomLeft: {
    position: "absolute",
    bottom: 16,
    left: 16,
  },
  overlayPillDark: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    gap: 6,
  },
  overlayPillLight: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    gap: 6,
  },
  overlayText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "500",
  },
  overlayTextDark: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
  },
  pipContainer: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 100,
    height: 140,
    backgroundColor: "#374151",
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  pipPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  pipInitial: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#FFF",
  },
  pipBottomOverlay: {
    position: "absolute",
    bottom: 8,
    left: 8,
  },
  pipLivePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  pipText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  controlsDock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1F2937",
    padding: spacing.md,
    borderRadius: radius.xl,
    marginTop: spacing.md,
  },
  controlItem: {
    alignItems: "center",
    gap: 8,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.1)",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  starIcon: {
    marginHorizontal: 4,
  },
  feedbackInput: {
    width: "100%",
    backgroundColor: "#F3F4F6",
    borderRadius: radius.md,
    padding: spacing.md,
    height: 100,
    textAlignVertical: "top",
    marginBottom: spacing.lg,
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    width: "100%",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  skipButton: {
    paddingVertical: spacing.sm,
  },
  skipButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
  successView: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  successText: {
    fontSize: 14,
    color: colors.textSecondary,
  }
});
