import { colors, radius, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View, Pressable, TextInput, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from "react-native";
import React from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/context/AuthContext";

export default function ReviewSessionScreen() {
  const { id, counsellorId } = useLocalSearchParams<{ id: string; counsellorId: string }>();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile } = useAuth();

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "reviews"), {
        bookingId: id || "unknown",
        counsellorId: counsellorId || "unknown",
        studentId: profile?.uid || "Anonymous",
        rating,
        feedback: comment.trim(),
        createdAt: serverTimestamp(),
      });
      router.replace("/(student)/session/dashboard");
    } catch (e) {
      console.error("Failed to submit review", e);
      Alert.alert("Error", "Could not submit review at this time.");
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.replace("/(student)/session/dashboard");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons name="star" size={32} color="#F59E0B" />
          </View>
          <Text style={styles.title}>Session Completed</Text>
          <Text style={styles.subtitle}>How was your consultation?</Text>

          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)} style={styles.starBtn}>
                <Ionicons 
                  name={rating >= star ? "star" : "star-outline"} 
                  size={44} 
                  color={rating >= star ? "#F59E0B" : "#D1D5DB"} 
                />
              </Pressable>
            ))}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Any feedback for your counsellor? (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Share your experience..."
              placeholderTextColor="#9CA3AF"
              value={comment}
              onChangeText={setComment}
              multiline
              textAlignVertical="top"
            />
          </View>

          <Pressable 
            style={[styles.primaryBtn, rating === 0 && styles.primaryBtnDisabled]} 
            onPress={handleSubmit}
            disabled={rating === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Submit Feedback</Text>
            )}
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={handleSkip}>
            <Text style={styles.secondaryBtnText}>Skip for now</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, alignItems: "center", flexGrow: 1, justifyContent: "center" },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: { ...typography.heading, color: colors.text, marginBottom: spacing.xs, fontWeight: "700" },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: spacing.xl, textAlign: "center" },
  starsContainer: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xl },
  starBtn: { padding: 4 },
  inputContainer: { width: "100%", marginBottom: spacing.xl },
  inputLabel: { fontSize: 14, fontWeight: "500", color: colors.text, marginBottom: spacing.sm },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    height: 120,
    color: colors.text,
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.full,
    alignItems: "center",
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnDisabled: { 
    backgroundColor: "rgba(35,133,109,0.4)",
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  secondaryBtn: { paddingVertical: 12, paddingHorizontal: 24 },
  secondaryBtnText: { color: colors.textSecondary, fontSize: 15, fontWeight: "500" },
});
