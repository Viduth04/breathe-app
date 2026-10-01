import { colors, radius, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";

export default function SessionsScreen() {
  const [filter, setFilter] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [mainTab, setMainTab] = useState<"my-sessions" | "find-counselor">("find-counselor");
  const [availableNow, setAvailableNow] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Counselor Booking</Text>
        <View>
          <Image
            source={{ uri: "https://i.pravatar.cc/150?img=47" }}
            style={styles.avatar}
          />
          <View style={styles.onlineBadge} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search counselors by name or specialty..."
            placeholderTextColor={colors.textSecondary}
          />
          <Ionicons name="close-circle-outline" size={20} color={colors.textSecondary} />
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories} contentContainerStyle={styles.categoriesContent}>
          <View style={[styles.categoryPill, styles.categoryPillActive]}>
            <Text style={[styles.categoryText, styles.categoryTextActive]}>All</Text>
          </View>
          {["Anxiety", "Stress", "Depression", "Academic"].map((cat) => (
            <View key={cat} style={styles.categoryPill}>
              <Text style={styles.categoryText}>{cat}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Top Tabs */}
        <View style={styles.topTabs}>
          <Pressable 
            style={[styles.tab, mainTab === "my-sessions" && styles.tabActive]}
            onPress={() => setMainTab("my-sessions")}
          >
            <Text style={[styles.tabText, mainTab === "my-sessions" && styles.tabTextActive]}>My Sessions (2)</Text>
          </Pressable>
          <Pressable 
            style={[styles.tab, mainTab === "find-counselor" && styles.tabActive]}
            onPress={() => setMainTab("find-counselor")}
          >
            <Text style={[styles.tabText, mainTab === "find-counselor" && styles.tabTextActive]}>Find Counselor</Text>
          </Pressable>
        </View>

        {mainTab === "my-sessions" && (
          <>
            {/* Sub-filters */}
        <View style={styles.subFilters}>
          <Pressable 
            style={[styles.subFilterPill, filter === "upcoming" && styles.subFilterPillActive]}
            onPress={() => setFilter("upcoming")}
          >
            <Text style={[styles.subFilterText, filter === "upcoming" && styles.subFilterTextActive]}>Upcoming (2)</Text>
          </Pressable>
          <Pressable 
            style={[styles.subFilterPill, filter === "past" && styles.subFilterPillActive]}
            onPress={() => setFilter("past")}
          >
            <Text style={[styles.subFilterText, filter === "past" && styles.subFilterTextActive]}>Past (4)</Text>
          </Pressable>
          <Pressable 
            style={[styles.subFilterPill, filter === "cancelled" && styles.subFilterPillActive]}
            onPress={() => setFilter("cancelled")}
          >
            <Text style={[styles.subFilterText, filter === "cancelled" && styles.subFilterTextActive]}>Cancelled (1)</Text>
          </Pressable>
        </View>

        {filter === "upcoming" && (
          <>
            {/* Section Title */}
            <View style={styles.sectionHeader}>
              <Text style={typography.heading}>My Booked Sessions</Text>
              <Text style={typography.caption}>Manage your scheduled & completed bookings</Text>
            </View>

            {/* Session Card 1 */}
            <Pressable onPress={() => router.push("/(student)/session/details")}>
              <Card style={styles.sessionCard}>
                <View style={styles.cardTopRow}>
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Confirmed • In 3 Days</Text>
                </View>
                <Text style={styles.refText}>Ref: #ME-8041</Text>
              </View>

              <View style={styles.doctorInfo}>
                <Image source={{ uri: "https://i.pravatar.cc/150?img=5" }} style={styles.doctorAvatar} />
                <View style={styles.doctorDetails}>
                  <View style={styles.doctorNameRow}>
                    <Text style={styles.doctorName}>Dr. Anjali Perera</Text>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.doctorSpecialty}>Specialty: Stress & Academic Anxiety</Text>
                </View>
              </View>

              <View style={styles.sessionDetailsBox}>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color={colors.text} />
                  <Text style={styles.detailTextBold}>Mon, 15 Aug 2026 • 10:00 AM </Text>
                  <Text style={styles.detailTextLight}>(45 min)</Text>
                </View>
                <View style={styles.badgesRow}>
                  <View style={styles.infoBadge}>
                    <Ionicons name="videocam-outline" size={14} color={colors.primary} />
                    <Text style={styles.infoBadgeText}>Video Call</Text>
                  </View>
                  <View style={styles.infoBadge}>
                    <Ionicons name="shield-checkmark-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.infoBadgeTextDark}>Anonymous Mode</Text>
                  </View>
                </View>
              </View>

              <Button title="Join Session" icon="videocam-outline" onPress={() => router.push("/(student)/session/video-call")} style={styles.joinButton} />
              
              <View style={styles.actionButtonsRow}>
                <Pressable style={styles.rescheduleButton}>
                  <Text style={styles.rescheduleText}>Reschedule</Text>
                </Pressable>
                <Pressable style={styles.cancelButton} onPress={() => router.push("/(student)/session/cancel")}>
                  <Text style={styles.cancelText}>Cancel Booking</Text>
                </Pressable>
              </View>
            </Card>
          </Pressable>

          {/* Session Card 2 */}
            <Card style={styles.sessionCard}>
              <View style={styles.cardTopRow}>
                <View style={[styles.statusPill, { backgroundColor: colors.success }]}>
                  <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.statusText, { color: colors.primary }]}>Confirmed</Text>
                </View>
                <Text style={styles.refText}>Ref: #ME-9218</Text>
              </View>

              <View style={styles.doctorInfo}>
                <Image source={{ uri: "https://i.pravatar.cc/150?img=11" }} style={styles.doctorAvatar} />
                <View style={styles.doctorDetails}>
                  <View style={styles.doctorNameRow}>
                    <Text style={styles.doctorName}>Dr. Rohan Silva</Text>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.doctorSpecialty}>Specialty: Depression & Mindfulness</Text>
                </View>
              </View>

              <View style={styles.sessionDetailsBox}>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color={colors.text} />
                  <Text style={styles.detailTextBold}>Fri, 26 Aug 2026 • 02:00 PM </Text>
                  <Text style={styles.detailTextLight}>(45 min)</Text>
                </View>
                <View style={styles.badgesRow}>
                  <View style={styles.infoBadge}>
                    <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
                    <Text style={styles.infoBadgeText}>Chat Session</Text>
                  </View>
                  <View style={styles.infoBadge}>
                    <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.infoBadgeTextDark}>Standard ID</Text>
                  </View>
                </View>
              </View>

              <Button title="Join Chat Session" icon="chatbubbles-outline" onPress={() => router.push("/(student)/session/chat")} style={styles.joinButton} />
              
              <View style={styles.actionButtonsRow}>
                <Pressable style={styles.rescheduleButton}>
                  <Text style={styles.rescheduleText}>Reschedule</Text>
                </Pressable>
                <Pressable style={styles.cancelButton} onPress={() => router.push('/(student)/session/cancel')}><Text style={styles.cancelText}>Cancel Booking</Text></Pressable>
              </View>
            </Card>
          </>
        )}

        {filter === "past" && (
          <>
            <View style={[styles.sectionHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <Text style={[typography.caption, { color: colors.primary, fontWeight: '700', letterSpacing: 0.5 }]}>COMPLETED HISTORY (4)</Text>
              <Text style={typography.caption}>Auto-archived</Text>
            </View>

            {/* Past Card 1 */}
            <Card style={styles.sessionCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Completed • 12 Jul 2026</Text>
                </View>
                <Text style={styles.refText}>Ref: #ME-7420</Text>
              </View>

              <View style={styles.doctorInfo}>
                <Image source={{ uri: "https://i.pravatar.cc/150?img=5" }} style={styles.doctorAvatar} />
                <View style={styles.doctorDetails}>
                  <View style={styles.doctorNameRow}>
                    <Text style={styles.doctorName}>Dr. Anjali Perera</Text>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.doctorSpecialty}>Specialty: Stress & Academic Anxiety</Text>
                </View>
              </View>

              <View style={styles.sessionDetailsBox}>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color={colors.text} />
                  <Text style={styles.detailTextBold}>Wed, 12 Jul 2026 • 10:00 AM </Text>
                  <Text style={styles.detailTextLight}>(45 min)</Text>
                </View>
                <View style={styles.badgesRow}>
                  <View style={styles.infoBadge}>
                    <Ionicons name="videocam-outline" size={14} color={colors.primary} />
                    <Text style={styles.infoBadgeText}>Video Call</Text>
                  </View>
                  <View style={styles.infoBadge}>
                    <Ionicons name="shield-checkmark-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.infoBadgeTextDark}>Anonymous Mode</Text>
                  </View>
                </View>
              </View>
              
              <Pressable style={styles.viewNotesButtonFull} onPress={() => router.push("/(student)/session/summary")}>
                <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                <Text style={styles.rescheduleText}>View Summary Notes</Text>
              </Pressable>
            </Card>

            {/* Past Card 2 */}
            <Card style={styles.sessionCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Completed • 28 Jun 2026</Text>
                </View>
                <Text style={styles.refText}>Ref: #ME-6914</Text>
              </View>

              <View style={styles.doctorInfo}>
                <Image source={{ uri: "https://i.pravatar.cc/150?img=9" }} style={styles.doctorAvatar} />
                <View style={styles.doctorDetails}>
                  <View style={styles.doctorNameRow}>
                    <Text style={styles.doctorName}>Ms. Nimali Fernando</Text>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.doctorSpecialty}>Specialty: Relationships & Family</Text>
                </View>
              </View>

              <View style={styles.sessionDetailsBox}>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color={colors.text} />
                  <Text style={styles.detailTextBold}>Thu, 28 Jun 2026 • 04:00 PM </Text>
                  <Text style={styles.detailTextLight}>(45 min)</Text>
                </View>
                <View style={styles.badgesRow}>
                  <View style={styles.infoBadge}>
                    <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
                    <Text style={styles.infoBadgeText}>Chat Session</Text>
                  </View>
                  <View style={styles.infoBadge}>
                    <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.infoBadgeTextDark}>Standard ID</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.actionButtonsRow}>
                <Pressable style={styles.viewNotesButtonHalf}>
                  <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                  <Text style={styles.rescheduleText}>View Notes</Text>
                </Pressable>
                <Button title="Book Again" icon="calendar-outline" onPress={() => router.push("/(student)/session/book")} style={styles.bookAgainButton} />
              </View>
            </Card>

            {/* Past Card 3 */}
            <Card style={styles.sessionCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Completed • 10 Jun 2026</Text>
                </View>
                <Text style={styles.refText}>Ref: #ME-6105</Text>
              </View>

              <View style={styles.doctorInfo}>
                <Image source={{ uri: "https://i.pravatar.cc/150?img=11" }} style={styles.doctorAvatar} />
                <View style={styles.doctorDetails}>
                  <View style={styles.doctorNameRow}>
                    <Text style={styles.doctorName}>Dr. Rohan Silva</Text>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.doctorSpecialty}>Specialty: Depression & Mindfulness</Text>
                </View>
              </View>

              <View style={styles.sessionDetailsBox}>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color={colors.text} />
                  <Text style={styles.detailTextBold}>Tue, 10 Jun 2026 • 02:00 PM </Text>
                  <Text style={styles.detailTextLight}>(45 min)</Text>
                </View>
                <View style={styles.badgesRow}>
                  <View style={styles.infoBadge}>
                    <Ionicons name="videocam-outline" size={14} color={colors.primary} />
                    <Text style={styles.infoBadgeText}>Video Call</Text>
                  </View>
                  <View style={styles.infoBadge}>
                    <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.infoBadgeTextDark}>Standard ID</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.actionButtonsRow}>
                <Pressable style={styles.viewNotesButtonHalf}>
                  <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                  <Text style={styles.rescheduleText}>View Notes</Text>
                </Pressable>
                <Button title="Book Again" icon="calendar-outline" onPress={() => router.push("/(student)/session/book")} style={styles.bookAgainButton} />
              </View>
            </Card>
          </>
        )}

        {filter === "cancelled" && (
          <>
            {/* Notice Card */}
            <View style={styles.noticeCard}>
              <View style={styles.noticeIconBox}>
                <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.noticeTextContainer}>
                <Text style={styles.noticeTitle}>Cancellation Policy Notice</Text>
                <Text style={styles.noticeBody}>
                  Cancelled sessions are archived for your records. No charges apply for sessions cancelled {">"}24 hrs in advance.
                </Text>
              </View>
            </View>

            {/* Cancelled Card */}
            <Card style={styles.sessionCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.cancelledPill}>
                  <View style={styles.cancelledDot} />
                  <Text style={styles.cancelledStatusText}>Cancelled by You • 02 Aug 2026</Text>
                </View>
                <Text style={styles.refText}>Ref: #ME-7890</Text>
              </View>

              <View style={styles.doctorInfo}>
                <Image source={{ uri: "https://i.pravatar.cc/150?img=5" }} style={styles.doctorAvatar} />
                <View style={styles.doctorDetails}>
                  <View style={styles.doctorNameRowSpace}>
                    <View style={styles.doctorNameRow}>
                      <Text style={styles.doctorName}>Dr. Anjali Perera</Text>
                      <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    </View>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.ratingText}>4.9</Text>
                    </View>
                  </View>
                  <Text style={[styles.doctorSpecialty, { color: colors.primary }]}>Specialty: Stress & Academic Anxiety</Text>
                  <Text style={styles.doctorSubSpecialty}>Senior University Counselor • Psy.D.</Text>
                </View>
              </View>

              <View style={styles.originalSlotBox}>
                <View style={styles.originalSlotHeaderRow}>
                  <View style={styles.calendarIconBox}>
                    <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.originalSlotLabel}>Original Slot</Text>
                    <Text style={styles.originalSlotTime}>Sun, 04 Aug 2026 • 11:00 AM (45 min)</Text>
                  </View>
                </View>
                <View style={styles.badgesRow}>
                  <View style={styles.infoBadge}>
                    <Ionicons name="videocam-outline" size={14} color={colors.primary} />
                    <Text style={styles.infoBadgeText}>Video Call</Text>
                  </View>
                  <View style={[styles.infoBadge, { backgroundColor: colors.selected, borderColor: colors.selected }]}>
                    <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
                    <Text style={styles.infoBadgeText}>Anonymous Mode</Text>
                  </View>
                </View>
                <View style={styles.reasonRow}>
                  <Text style={styles.reasonLabel}>Reason: </Text>
                  <Text style={styles.reasonText}>Schedule Conflict / Academic Exam</Text>
                </View>
              </View>

              <Button title="Rebook with Dr. Anjali" icon="calendar-outline" onPress={() => router.push("/(student)/session/book")} style={styles.rebookButton} />
            </Card>

            {/* Empty State */}
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIconBox}>
                <Ionicons name="checkbox-outline" size={24} color={colors.textSecondary} />
              </View>
              <Text style={styles.emptyStateText}>No other cancelled appointments in your history.</Text>
              <Text style={styles.emptyStateSubtext}>Need urgent support? 24/7 Peer Warmline is active.</Text>
            </View>
          </>
        )}
        </>
        )}

        {mainTab === "find-counselor" && (
          <View style={styles.findCounselorContainer}>
            {/* Toggle Box */}
            <View style={styles.availabilityToggleBox}>
              <View>
                <Text style={styles.availabilityTitle}>Show only available now</Text>
                <Text style={styles.availabilitySub}>Filter by immediate calendar openings</Text>
              </View>
              <Switch value={availableNow} onValueChange={setAvailableNow} trackColor={{ true: colors.primary }} />
            </View>

            {/* Sort Row */}
            <View style={styles.sortRow}>
              <Text style={styles.showingText}>Showing <Text style={{fontWeight: '700'}}>4 matching counselors</Text></Text>
              <View style={styles.sortRight}>
                <Text style={styles.sortText}>Sort: Highest Rated</Text>
                <Ionicons name="chevron-down" size={14} color={colors.text} />
              </View>
            </View>

            {/* Card 1 */}
            <Card style={styles.findCard}>
              <View style={styles.findCardTop}>
                <Image source={{ uri: "https://i.pravatar.cc/150?img=5" }} style={styles.findAvatar} />
                <View style={styles.findDetails}>
                  <Text style={styles.findName}>Dr. Anjali Perera</Text>
                  <Text style={styles.findSpecialty}>Specialty: Anxiety & Stress</Text>
                  <View style={styles.findRatingRow}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.findRating}>4.8 <Text style={styles.findRatingCount}>(124)</Text></Text>
                    <Text style={styles.findAvailability}>Available Today</Text>
                  </View>
                </View>
                <Ionicons name="bookmark-outline" size={20} color={colors.textSecondary} style={styles.bookmarkIcon} />
              </View>
              <View style={styles.findCardBottom}>
                <View style={styles.nextTimeRow}>
                  <Ionicons name="time-outline" size={16} color={colors.text} />
                  <Text style={styles.nextTimeText}>Next: <Text style={{fontWeight: '700'}}>2:00 PM</Text></Text>
                </View>
                <Pressable style={styles.viewProfileBtn} onPress={() => router.push("/(student)/session/counselor")}>
                  <Text style={styles.viewProfileText}>View Profile</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </Pressable>
              </View>
            </Card>

            {/* Card 2 */}
            <Card style={styles.findCard}>
              <View style={styles.findCardTop}>
                <Image source={{ uri: "https://i.pravatar.cc/150?img=11" }} style={styles.findAvatar} />
                <View style={styles.findDetails}>
                  <Text style={styles.findName}>Mr. Kasun Silva</Text>
                  <Text style={styles.findSpecialty}>Specialty: Academic Pressure</Text>
                  <View style={styles.findRatingRow}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.findRating}>4.6 <Text style={styles.findRatingCount}>(89)</Text></Text>
                    <Text style={styles.findAvailability}>Available Tomorrow</Text>
                  </View>
                </View>
                <Ionicons name="bookmark-outline" size={20} color={colors.textSecondary} style={styles.bookmarkIcon} />
              </View>
              <View style={styles.findCardBottom}>
                <View style={styles.nextTimeRow}>
                  <Ionicons name="time-outline" size={16} color={colors.text} />
                  <Text style={styles.nextTimeText}>Next: <Text style={{fontWeight: '700'}}>9:30 AM</Text></Text>
                </View>
                <Pressable style={styles.viewProfileBtn} onPress={() => router.push("/(student)/session/counselor")}>
                  <Text style={styles.viewProfileText}>View Profile</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </Pressable>
              </View>
            </Card>

            {/* Card 3 */}
            <Card style={styles.findCard}>
              <View style={styles.findCardTop}>
                <Image source={{ uri: "https://i.pravatar.cc/150?img=9" }} style={styles.findAvatar} />
                <View style={styles.findDetails}>
                  <Text style={styles.findName}>Ms. Nimali Fernando</Text>
                  <Text style={styles.findSpecialty}>Specialty: Relationships & Family</Text>
                  <View style={styles.findRatingRow}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.findRating}>4.9 <Text style={styles.findRatingCount}>(210)</Text></Text>
                    <Text style={styles.findAvailability}>Available Today</Text>
                  </View>
                </View>
                <Ionicons name="bookmark-outline" size={20} color={colors.textSecondary} style={styles.bookmarkIcon} />
              </View>
              <View style={styles.findCardBottom}>
                <View style={styles.nextTimeRow}>
                  <Ionicons name="time-outline" size={16} color={colors.text} />
                  <Text style={styles.nextTimeText}>Next: <Text style={{fontWeight: '700'}}>4:15 PM</Text></Text>
                </View>
                <Pressable style={styles.viewProfileBtn} onPress={() => router.push("/(student)/session/counselor")}>
                  <Text style={styles.viewProfileText}>View Profile</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </Pressable>
              </View>
            </Card>

            {/* Card 4 */}
            <Card style={styles.findCard}>
              <View style={styles.findCardTop}>
                <Image source={{ uri: "https://i.pravatar.cc/150?img=8" }} style={styles.findAvatar} />
                <View style={styles.findDetails}>
                  <Text style={styles.findName}>Dr. Rohan Silva</Text>
                  <Text style={styles.findSpecialty}>Specialty: Depression & Mindfulness</Text>
                  <View style={styles.findRatingRow}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.findRating}>4.7 <Text style={styles.findRatingCount}>(78)</Text></Text>
                    <Text style={styles.findAvailability}>Available Fri</Text>
                  </View>
                </View>
                <Ionicons name="bookmark-outline" size={20} color={colors.textSecondary} style={styles.bookmarkIcon} />
              </View>
              <View style={styles.findCardBottom}>
                <View style={styles.nextTimeRow}>
                  <Ionicons name="time-outline" size={16} color={colors.text} />
                  <Text style={styles.nextTimeText}>Next: <Text style={{fontWeight: '700'}}>11:00 AM</Text></Text>
                </View>
                <Pressable style={styles.viewProfileBtn} onPress={() => router.push("/(student)/session/counselor")}>
                  <Text style={styles.viewProfileText}>View Profile</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </Pressable>
              </View>
            </Card>

            {/* Urgent Support */}
            <View style={styles.urgentSupportBox}>
              <View style={styles.urgentSupportLeft}>
                <Ionicons name="accessibility-outline" size={20} color={colors.text} style={styles.urgentIcon} />
                <View>
                  <Text style={styles.urgentTitle}>Need urgent support?</Text>
                  <Text style={styles.urgentBody}>Our peer mental wellness{"\n"}helpline is open 24/7 with zero{"\n"}waiting.</Text>
                </View>
              </View>
              <Pressable style={styles.talkNowBtn}>
                <Text style={styles.talkNowText}>Talk Now</Text>
              </Pressable>
            </View>
          </View>
        )}

      </ScrollView>
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
    ...typography.heading,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  categories: {
    marginBottom: spacing.md,
  },
  categoriesContent: {
    gap: spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: colors.white,
    fontWeight: "600",
  },
  topTabs: {
    flexDirection: "row",
    backgroundColor: colors.success,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "500",
  },
  tabTextActive: {
    color: colors.white,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  subFilters: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  subFilterPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 4,
  },
  subFilterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  subFilterText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  subFilterTextActive: {
    color: colors.white,
    fontWeight: "500",
  },
  sessionCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  refText: {
    ...typography.caption,
    fontWeight: "600",
    color: "#B4B4B4",
  },
  doctorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  doctorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  doctorDetails: {
    flex: 1,
  },
  doctorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  doctorName: {
    ...typography.heading,
    fontSize: 16,
  },
  doctorSpecialty: {
    ...typography.caption,
  },
  sessionDetailsBox: {
    backgroundColor: "#F4FAF6",
    padding: spacing.md,
    borderRadius: radius.sm,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailTextBold: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  detailTextLight: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  badgesRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoBadgeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "500",
  },
  infoBadgeTextDark: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  joinButton: {
    marginTop: spacing.sm,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: 4,
  },
  rescheduleButton: {
    flex: 1,
    backgroundColor: colors.success,
    paddingVertical: 12,
    borderRadius: radius.full,
    alignItems: "center",
  },
  rescheduleText: {
    color: colors.primary,
    fontWeight: "600",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.dangerTint,
    paddingVertical: 12,
    borderRadius: radius.full,
    alignItems: "center",
  },
  cancelText: {
    color: colors.danger,
    fontWeight: "600",
  },
  viewNotesButtonFull: {
    flexDirection: "row",
    backgroundColor: colors.success,
    paddingVertical: 12,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.xs,
  },
  viewNotesButtonHalf: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.success,
    paddingVertical: 12,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  bookAgainButton: {
    flex: 1,
  },
  noticeCard: {
    flexDirection: "row",
    backgroundColor: "#EFECE0",
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  noticeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.selected,
    alignItems: "center",
    justifyContent: "center",
  },
  noticeTextContainer: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 4,
  },
  noticeBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  cancelledPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCE8E8",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 6,
  },
  cancelledDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
  },
  cancelledStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.danger,
  },
  doctorNameRowSpace: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  doctorSubSpecialty: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  originalSlotBox: {
    backgroundColor: "#F3F0E6",
    padding: spacing.md,
    borderRadius: radius.sm,
    gap: spacing.sm,
  },
  originalSlotHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 4,
  },
  calendarIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  originalSlotLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  originalSlotTime: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  reasonRow: {
    flexDirection: "row",
    marginTop: spacing.sm,
  },
  reasonLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  reasonText: {
    fontSize: 13,
    color: colors.text,
  },
  rebookButton: {
    marginTop: spacing.sm,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  emptyStateIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFECE0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  findCounselorContainer: {
    paddingBottom: spacing.xl,
  },
  availabilityToggleBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  availabilityTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  availabilitySub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  showingText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sortRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sortText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  findCard: {
    borderWidth: 1,
    borderColor: "#BBE5C4",
    marginBottom: spacing.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  findCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  findAvatar: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  findDetails: {
    flex: 1,
  },
  findName: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
  },
  findSpecialty: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  findRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  findRating: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  findRatingCount: {
    fontSize: 11,
    fontWeight: "400",
    color: colors.textSecondary,
  },
  findAvailability: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    marginLeft: spacing.md,
  },
  bookmarkIcon: {
    marginLeft: "auto",
  },
  findCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nextTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  nextTimeText: {
    fontSize: 13,
    color: colors.text,
  },
  viewProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    gap: 4,
  },
  viewProfileText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
  },
  urgentSupportBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    padding: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xl * 2,
  },
  urgentSupportLeft: {
    flexDirection: "row",
    flex: 1,
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  urgentIcon: {
    marginTop: 2,
  },
  urgentTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  urgentBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  talkNowBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  talkNowText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
});
