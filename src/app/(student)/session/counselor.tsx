import { colors, radius, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import CounsellorAvatar from "@/components/common/CounsellorAvatar";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "@/components/common/Card";

export default function CounselorProfileScreen() {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState("15");

  const getMockData = (cId: string) => {
    const charCode = cId.charCodeAt(0) || 0;
    return {
      rating: ((charCode % 5) * 0.1 + 4.5).toFixed(1),
      reviews: (charCode % 50) + 80,
      avatar: `https://i.pravatar.cc/150?u=${cId}`,
    };
  };



  // Helper for calendar days
  const renderDay = (day: string, state: "empty" | "available" | "selected" | "unavailable") => {
    let boxStyle: any = styles.dayBox;
    let textStyle: any = styles.dayText;

    let actualState = state;
    if (state === "available" && day === selectedDate) {
      actualState = "selected";
    } else if (state === "selected" && day !== selectedDate) {
      actualState = "available";
    }

    if (actualState === "available") {
      boxStyle = [styles.dayBox, styles.dayAvailable];
    } else if (actualState === "selected") {
      boxStyle = [styles.dayBox, styles.daySelected];
      textStyle = [styles.dayText, styles.dayTextSelected];
    } else if (actualState === "unavailable") {
      boxStyle = [styles.dayBox, styles.dayUnavailable];
      textStyle = [styles.dayText, styles.dayTextUnavailable];
    } else if (actualState === "empty") {
      textStyle = [styles.dayText, styles.dayTextEmpty];
    }

    return (
      <View key={day + actualState} style={styles.dayWrapper}>
        <Pressable style={boxStyle} onPress={() => { if (actualState === 'available' || actualState === 'selected') setSelectedDate(day); }}>
          <Text style={textStyle}>{day}</Text>
        </Pressable>
      </View>
    );
  };

  const { uid } = useLocalSearchParams<{ uid: string }>();
  const mockData = uid ? getMockData(uid as string) : null;
  const [counsellor, setCounsellor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (uid) {
      getDoc(doc(db, "counsellors", uid)).then((snap) => {
        if (snap.exists()) {
          setCounsellor({ id: snap.id, ...snap.data() });
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [uid]);

  if (loading) {
    return <SafeAreaView style={styles.container}><ActivityIndicator style={{marginTop: 100}} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => { if (router.canGoBack()) { router.back(); } else { router.push("/(student)/session/dashboard"); } }} style={styles.backButton}>
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
            <CounsellorAvatar uid={counsellor.uid} name={counsellor.fullName} size={100} />
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={12} color="#FFF" />
            </View>
          </View>
          
          {counsellor?.fullName && <Text style={styles.counselorName}>{counsellor.fullName}</Text>}
          {counsellor?.title ? <Text style={styles.counselorTitle}>{counsellor.title}</Text> : null}
          
          <View style={styles.ratingBadge}>
    <Ionicons name="briefcase" size={14} color="#F59E0B" />
    <Text style={styles.ratingText}>{counsellor?.experienceYears || 0} Years Exp</Text>
  </View>

          <View style={styles.tagsRow}>
            {counsellor?.languages?.map((lang: string) => (
              <View key={lang} style={[styles.tagPill, { backgroundColor: "#E5F8E4" }]}>
                <Ionicons name="language-outline" size={14} color={colors.primary} />
                <Text style={styles.tagTextPrimary}>{lang}</Text>
              </View>
            ))}
            {counsellor?.experienceYears && (
              <View style={[styles.tagPill, { backgroundColor: "#F3F0E6" }]}>
                <Ionicons name="school-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.tagTextSecondary}>{counsellor.experienceYears}+ Years</Text>
              </View>
            )}
          </View>
        </View>

        {/* About Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.titleLine} />
            <Text style={styles.sectionTitle}>About</Text>
          </View>
          <Text style={styles.bodyText}>
            {counsellor?.bio || "No biography provided."}
          </Text>
        </Card>

        {/* Specialties Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.titleLine} />
            <Text style={styles.sectionTitle}>Specialties</Text>
          </View>
          <View style={styles.specialtiesGrid}>
            {counsellor?.specialties?.map((spec: string) => (
              <View key={spec} style={styles.specialtyPill}>
                <Text style={styles.specialtyText}>{spec}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Next Available Card */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeaderBetween}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.titleLine} />
                <Text style={styles.sectionTitle}>Next Available</Text>
              </View>
              <Pressable style={styles.viewCalendarLink} onPress={() => setShowCalendar(!showCalendar)}>
                <Text style={styles.viewCalendarText}>{showCalendar ? "Hide Calendar" : "View Calendar"}</Text>
                <Ionicons name={showCalendar ? "chevron-up" : "arrow-forward"} size={12} color={colors.primary} />
              </Pressable>
            </View>

            {showCalendar && (
              <View style={{ marginTop: 16 }}>
                {/* Calendar Header */}
                <View style={styles.calendarHeader}>
                  <View>
                    <Text style={styles.monthTitle}>Octust 2026</Text>
                    <Text style={styles.monthSubtitle}>Select your consultation day</Text>
                  </View>
                  <View style={styles.monthNav}>
                    <Pressable style={styles.navBtn}>
                      <Ionicons name="chevron-back" size={16} color={colors.text} />
                    </Pressable>
                    <Pressable style={styles.navBtn}>
                      <Ionicons name="chevron-forward" size={16} color={colors.text} />
                    </Pressable>
                  </View>
                </View>

                {/* Days of week */}
                <View style={styles.weekDaysRow}>
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <Text key={i} style={styles.weekDayText}>{d}</Text>
                  ))}
                </View>

                {/* Calendar Grid */}
                <View style={styles.calendarGrid}>
                  {/* Row 1 */}
                  {renderDay("27", "empty")}
                  {renderDay("28", "empty")}
                  {renderDay("29", "empty")}
                  {renderDay("30", "empty")}
                  {renderDay("01", "unavailable")}
                  {renderDay("02", "unavailable")}
                  {renderDay("03", "unavailable")}
                  {/* Row 2 */}
                  {renderDay("04", "unavailable")}
                  {renderDay("05", "unavailable")}
                  {renderDay("06", "unavailable")}
                  {renderDay("07", "unavailable")}
                  {renderDay("08", "unavailable")}
                  {renderDay("09", "unavailable")}
                  {renderDay("10", "unavailable")}
                  {/* Row 3 */}
                  {renderDay("11", "unavailable")}
                  {renderDay("12", "unavailable")}
                  {renderDay("13", "unavailable")}
                  {renderDay("14", "unavailable")}
                  {renderDay("15", "available")}
                  {renderDay("16", "unavailable")}
                  {renderDay("17", "unavailable")}
                  {/* Row 4 */}
                  {renderDay("18", "available")}
                  {renderDay("19", "unavailable")}
                  {renderDay("20", "unavailable")}
                  {renderDay("21", "unavailable")}
                  {renderDay("22", "available")}
                  {renderDay("23", "unavailable")}
                  {renderDay("24", "unavailable")}
                </View>

                
              </View>
            )}

            <View style={[styles.slotsGrid, { marginTop: showCalendar ? 0 : 0 }]}>
              <View style={[styles.slotBox, styles.slotBoxActive]}>
                <Ionicons name="calendar-outline" size={16} color="#FFF" />
                <Text style={[styles.slotText, styles.slotTextActive]}>Mon, {selectedDate} Oct</Text>
              </View>
              {selectedDate === "15" ? (
                <>
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
                </>
              ) : selectedDate === "18" ? (
                <>
                  <View style={styles.slotBox}>
                    <Ionicons name="time-outline" size={16} color={colors.primary} />
                    <Text style={styles.slotText}>09:30 AM</Text>
                  </View>
                  <View style={styles.slotBox}>
                    <Ionicons name="time-outline" size={16} color={colors.primary} />
                    <Text style={styles.slotText}>11:00 AM</Text>
                  </View>
                </>
              ) : selectedDate === "22" ? (
                <>
                  <View style={styles.slotBox}>
                    <Ionicons name="time-outline" size={16} color={colors.primary} />
                    <Text style={styles.slotText}>1:00 PM</Text>
                  </View>
                  <View style={styles.slotBox}>
                    <Ionicons name="time-outline" size={16} color={colors.primary} />
                    <Text style={styles.slotText}>3:30 PM</Text>
                  </View>
                </>
              ) : (
                <Text style={{color: colors.textSecondary, alignSelf: 'center', marginVertical: 10}}>No slots available</Text>
              )}
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
        <Pressable style={styles.bookSessionBtn} onPress={() => router.push({ pathname: "/(student)/session/book", params: { uid: counsellor?.id } })}>
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
    fontWeight: "600",
    fontSize: 16,
    color: "#FFF",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  monthSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  monthNav: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F0E6",
    alignItems: "center",
    justifyContent: "center",
  },
  weekDaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  weekDayText: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  dayWrapper: {
    width: `${100 / 7}%`,
    alignItems: "center",
  },
  dayBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dayAvailable: {
    backgroundColor: "#F3F0E6",
  },
  daySelected: {
    backgroundColor: colors.primary,
  },
  dayUnavailable: {
    backgroundColor: "#F3F3F3",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  dayTextEmpty: {
    color: "#E0E0E0",
  },
  dayTextSelected: {
    color: "#FFF",
  },
  dayTextUnavailable: {
    color: "#B4B4B4",
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.lg,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
