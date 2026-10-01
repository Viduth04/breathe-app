import { colors, radius, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "@/components/common/Card";

export default function CounselorProfileScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Counselor Booking</Text>
        <View style={styles.headerRightIcon}>
          <Ionicons name="person-outline" size={20} color="#FFF" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Info (Centered) */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: "https://i.pravatar.cc/150?img=5" }}
              style={styles.avatar}
            />
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={12} color="#FFF" />
            </View>
          </View>
          
          <Text style={styles.counselorName}>Dr. Anjali Perera</Text>
          <Text style={styles.counselorTitle}>Licensed Clinical Psychologist</Text>
          
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.ratingText}>
              4.8 <Text style={styles.ratingCount}>(124 reviews)</Text>
            </Text>
          </View>

          <View style={styles.tagsRow}>
            <View style={[styles.tagPill, { backgroundColor: "#E5F8E4" }]}>
              <Ionicons name="chatbubbles-outline" size={14} color={colors.primary} />
              <Text style={styles.tagTextPrimary}>English</Text>
            </View>
            <View style={[styles.tagPill, { backgroundColor: "#E5F8E4" }]}>
              <Ionicons name="language-outline" size={14} color={colors.primary} />
              <Text style={styles.tagTextPrimary}>Sinhala</Text>
            </View>
            <View style={[styles.tagPill, { backgroundColor: "#F3F0E6" }]}>
              <Ionicons name="school-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.tagTextSecondary}>10+ Years</Text>
            </View>
          </View>
        </View>

        {/* About Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.titleLine} />
            <Text style={styles.sectionTitle}>About</Text>
          </View>
          <Text style={styles.bodyText}>
            Dr. Perera specializes in anxiety, academic stress, and young adult mental health with over a decade of campus counseling experience.
          </Text>
        </Card>

        {/* Specialties Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.titleLine} />
            <Text style={styles.sectionTitle}>Specialties</Text>
          </View>
          <View style={styles.specialtiesGrid}>
            <View style={styles.specialtyPill}>
              <Text style={styles.specialtyText}>Anxiety</Text>
            </View>
            <View style={styles.specialtyPill}>
              <Text style={styles.specialtyText}>Stress</Text>
            </View>
            <View style={styles.specialtyPill}>
              <Text style={styles.specialtyText}>Depression</Text>
            </View>
            <View style={styles.specialtyPill}>
              <Text style={styles.specialtyText}>Academic Pressure</Text>
            </View>
          </View>
        </Card>

        {/* Next Available Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderBetween}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.titleLine} />
              <Text style={styles.sectionTitle}>Next Available</Text>
            </View>
            <Pressable style={styles.viewCalendarLink}>
              <Text style={styles.viewCalendarText}>View Calendar</Text>
              <Ionicons name="arrow-forward" size={12} color={colors.primary} />
            </Pressable>
          </View>

          <View style={styles.slotsGrid}>
            <View style={[styles.slotBox, styles.slotBoxActive]}>
              <Ionicons name="calendar-outline" size={16} color="#FFF" />
              <Text style={[styles.slotText, styles.slotTextActive]}>Mon, 15 Aug</Text>
            </View>
            <View style={styles.slotBox}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={styles.slotText}>10:00 AM</Text>
            </View>
            <View style={styles.slotBox}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={styles.slotText}>2:00 PM</Text>
            </View>
            <View style={styles.slotBox}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={styles.slotText}>4:00 PM</Text>
            </View>
          </View>
        </Card>

        {/* Reviews Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderBetween}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.titleLine} />
              <Text style={styles.sectionTitle}>Reviews</Text>
            </View>
            <View style={styles.totalReviewsBadge}>
              <Text style={styles.totalReviewsText}>Total: 124</Text>
            </View>
          </View>

          <View style={styles.reviewItem}>
            <View style={styles.starsRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Ionicons name="star" size={14} color="#F59E0B" />
            </View>
            <Text style={styles.reviewText}>
              "Very helpful and understanding." <Text style={styles.reviewerName}>— Anonymous</Text>
            </Text>
          </View>

          <View style={styles.reviewDivider} />

          <View style={styles.reviewItem}>
            <View style={styles.starsRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Ionicons name="star-outline" size={14} color="#D1D5DB" />
            </View>
            <Text style={styles.reviewText}>
              "Good listener." <Text style={styles.reviewerName}>— Anonymous</Text>
            </Text>
          </View>
        </Card>

      </ScrollView>

      {/* Bottom Fixed Bar */}
      <View style={styles.bottomBar}>
        <Pressable style={styles.chatFirstBtn} onPress={() => router.push("/(student)/session/chat")}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
          <Text style={styles.chatFirstText}>Chat First</Text>
        </Pressable>
        <Pressable style={styles.bookSessionBtn} onPress={() => router.push("/(student)/session/book")}>
          <Ionicons name="calendar-outline" size={20} color="#FFF" />
          <Text style={styles.bookSessionText}>Book Session</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7F3",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "#F8F7F3",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  headerRightIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: spacing.md,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#A3D9B1",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F8F7F3",
  },
  counselorName: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 4,
  },
  counselorTitle: {
    fontSize: 14,
    color: colors.primary,
    opacity: 0.8,
    marginBottom: spacing.sm,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: 6,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  ratingCount: {
    fontWeight: "400",
    color: colors.textSecondary,
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  tagTextPrimary: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  tagTextSecondary: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  sectionCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: "#FFF",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.sm,
  },
  titleLine: {
    width: 4,
    height: 16,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  bodyText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  specialtiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  specialtyPill: {
    backgroundColor: "#F3F0E6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  specialtyText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.primary,
  },
  sectionHeaderBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  viewCalendarLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewCalendarText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  slotBox: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F0E6",
    paddingVertical: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  slotBoxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  slotTextActive: {
    color: "#FFF",
  },
  totalReviewsBadge: {
    backgroundColor: "#E5F8E4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  totalReviewsText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  reviewItem: {
    paddingVertical: 8,
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
    marginBottom: 4,
  },
  reviewText: {
    fontSize: 14,
    color: colors.text,
    fontStyle: "italic",
    lineHeight: 20,
  },
  reviewerName: {
    color: colors.textSecondary,
    fontStyle: "normal",
  },
  reviewDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  bottomBar: {
    flexDirection: "row",
    padding: spacing.md,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  chatFirstBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    gap: 8,
  },
  chatFirstText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
  bookSessionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    gap: 8,
  },
  bookSessionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
});
