import { FLOATING_HELP_CLEARANCE } from "@/components/crisis/UrgentHelpLink";
import { colors, radius, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable, Switch, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/common/Button";
import CounsellorAvatar from "@/components/common/CounsellorAvatar";
import Card from "@/components/common/Card";
import { listCounsellors } from "@/services/adminService";
import { listMyBookings } from "@/services/bookingService";
import { Booking } from "@/types/booking";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase/config";
import { addDoc, collection } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { CounsellorProfile } from "@/types/counsellor";

export default function SessionsScreen() {
  const [filter, setFilter] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [mainTab, setMainTab] = useState<"my-sessions" | "find-counselor">("find-counselor");
  const [availableNow, setAvailableNow] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [counsellors, setCounsellors] = useState<CounsellorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Booking[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  useEffect(() => {
    const fetchCounsellors = async () => {
      setLoading(true);
      try {
        const data = await listCounsellors();
        setCounsellors(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCounsellors();
    if (user) {
      setSessionsLoading(true);
      listMyBookings(user.uid).then(data => {
          setSessions(data);
          setSessionsLoading(false);
        }).catch(err => {
          console.error(err);
          setSessionsLoading(false);
        }).catch(e => {
        console.error(e);
        setSessionsLoading(false);        });      }    }, [user]);

  const filteredCounsellors = useMemo(() => {
    return counsellors.filter((c) => {
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchName = c.fullName.toLowerCase().includes(query);
        const matchSpecialty = c.specialties.some(s => s.toLowerCase().includes(query));
        if (!matchName && !matchSpecialty) return false;
      }
      if (selectedCategory !== "All") {
        if (!c.specialties.includes(selectedCategory as any)) return false;
      }
      if (availableNow) {
          if (!c.isAvailable) return false;
          if (!c.availableSlots || c.availableSlots.length === 0) return false;
        }
      return true;
    });
  }, [counsellors, searchQuery, selectedCategory, availableNow]);

  const upcomingSessions = useMemo(() => sessions.filter(s => s.status === "confirmed"), [sessions]);
  const pastSessions = useMemo(() => sessions.filter(s => s.status === "completed"), [sessions]);
  const cancelledSessions = useMemo(() => sessions.filter(s => s.status === "cancelled"), [sessions]);

  const getMockData = (uid: string) => {
    const charCode = uid.charCodeAt(0) || 0;
    return {
      rating: ((charCode % 5) * 0.1 + 4.5).toFixed(1),
      reviews: (charCode % 50) + 80,
      avatar: `https://i.pravatar.cc/150?u=${uid}`,
      nextTime: charCode % 2 === 0 ? "2:00 PM" : "9:30 AM",
      availabilityStr: charCode % 2 === 0 ? "Available Today" : "Available Tomorrow",
    };
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        
        <Text style={styles.headerTitle}>Counselor Booking</Text>
        
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search counselors by name or specialty..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle-outline" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories} contentContainerStyle={styles.categoriesContent}>
          <Pressable 
            style={[styles.categoryPill, selectedCategory === "All" && styles.categoryPillActive]}
            onPress={() => setSelectedCategory("All")}
          >
            <Text style={[styles.categoryText, selectedCategory === "All" && styles.categoryTextActive]}>All</Text>
          </Pressable>
          {["Anxiety", "Stress", "Depression", "Academic Pressure", "Sleep", "Relationships"].map((cat) => (
            <Pressable 
              key={cat} 
              style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Top Tabs */}
        <View style={styles.topTabs}>
          <Pressable 
            style={[styles.tab, mainTab === "my-sessions" && styles.tabActive]}
            onPress={() => setMainTab("my-sessions")}
          >
            <Text style={[styles.tabText, mainTab === "my-sessions" && styles.tabTextActive]}>My Sessions ({upcomingSessions.length + pastSessions.length + cancelledSessions.length})</Text>
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
            <Text style={[styles.subFilterText, filter === "upcoming" && styles.subFilterTextActive]}>Upcoming ({upcomingSessions.length})</Text>
          </Pressable>
          <Pressable 
            style={[styles.subFilterPill, filter === "past" && styles.subFilterPillActive]}
            onPress={() => setFilter("past")}
          >
            <Text style={[styles.subFilterText, filter === "past" && styles.subFilterTextActive]}>Past ({pastSessions.length})</Text>
          </Pressable>
          <Pressable 
            style={[styles.subFilterPill, filter === "cancelled" && styles.subFilterPillActive]}
            onPress={() => setFilter("cancelled")}
          >
            <Text style={[styles.subFilterText, filter === "cancelled" && styles.subFilterTextActive]}>Cancelled ({cancelledSessions.length})</Text>
          </Pressable>
        </View>

        {filter === "upcoming" && (
          <>
            {/* Section Title */}
            <View style={styles.sectionHeader}>
              <Text style={typography.heading}>My Booked Sessions</Text>
              <Text style={typography.caption}>Manage your scheduled & completed bookings</Text>
            </View>

            {sessionsLoading ? <ActivityIndicator style={{marginTop: 40}} /> : upcomingSessions.length === 0 ? <Text style={{textAlign: 'center', marginTop: 40}}>No upcoming sessions</Text> : upcomingSessions.map(session => (
                <Card key={session.id} style={styles.sessionCard}>
                  {/* Top Edge Indicator */}
                  <View style={styles.cardTopIndicator} />
                  
                  <View style={styles.cardContent}>
                    <View style={styles.cardTopRow}>
                      <View style={styles.statusPill}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>Confirmed • In 3 Days</Text>
                      </View>
                      <Text style={styles.refText}>Ref: {`#${session.id.substring(0, 5).toUpperCase()}`}</Text>
                    </View>

                    <View style={styles.doctorInfo}>
                      <View style={styles.avatarContainer}>
                        <View style={styles.doctorAvatar}>
                            <CounsellorAvatar uid={session.counsellorId} name={(counsellors.find(c => c.uid === session.counsellorId)?.fullName || "Doctor")} size={56} />
                          </View>
                        <View style={styles.verifiedBadge}>
                          <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                      </View>
                      <View style={styles.doctorDetails}>
                        <View style={styles.doctorNameRow}>
                          <Text style={styles.doctorName}>{(counsellors.find(c => c.uid === session.counsellorId)?.fullName || "Dr. Anjali Perera")}</Text>
                          <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                        </View>
                        <Text style={styles.doctorSpecialty}>Specialty: <Text style={{color: colors.textSecondary}}>{counsellors.find(c => c.uid === session.counsellorId)?.specialties?.[0] || "Stress & Academic Anxiety"}</Text></Text>
                      </View>
                    </View>

                    <View style={styles.sessionDetailsBox}>
                      <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={16} color={colors.primary} />
                        <Text style={styles.detailTextBold}>
                          {session.startAt && typeof session.startAt.toDate === 'function' ? 
                            session.startAt.toDate().toLocaleDateString('en-LK', { timeZone: 'Asia/Colombo', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + 
                            session.startAt.toDate().toLocaleTimeString('en-LK', { hour: "2-digit", minute: "2-digit", timeZone: 'Asia/Colombo' }) 
                            : 'Date TBD'
                          } <Text style={styles.detailTextLight}>(45 min)</Text>
                        </Text>
                      </View>
                      <View style={styles.badgesRow}>
                        <View style={styles.infoBadge}>
                          <Ionicons name="videocam-outline" size={14} color={colors.primary} />
                          <Text style={styles.infoBadgeTextDark}>Video Call</Text>
                        </View>
                        <View style={styles.infoBadge}>
                          <Ionicons name="shield-checkmark-outline" size={14} color={colors.textSecondary} />
                          <Text style={styles.infoBadgeTextDark}>Anonymous Mode</Text>
                        </View>
                      </View>
                    </View>
                    
                    <Pressable 
                      style={[styles.actionBtn, { backgroundColor: colors.primary, flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 14 }]} 
                      onPress={() => router.push({ pathname: "/(student)/session/video-call", params: { id: session.id }})}
                    >
                      <Ionicons name="videocam-outline" size={20} color={colors.white} />
                      <Text style={{ color: colors.white, fontWeight: '600', fontSize: 16 }}>Join Session</Text>
                    </Pressable>
                    
                    <View style={styles.actionButtonsRow}>
                      <Pressable style={[styles.actionBtn, styles.rescheduleBtn]} onPress={() => router.push({ pathname: "/(student)/session/counselor", params: { uid: session.counsellorId } })}>
                        <Text style={styles.rescheduleText}>Reschedule</Text>
                      </Pressable>
                      <Pressable style={[styles.actionBtn, styles.cancelBtn]} onPress={() => router.push({ pathname: '/(student)/session/cancel', params: { id: session.id }})}>
                        <Text style={styles.cancelText}>Cancel Booking</Text>
                      </Pressable>
                    </View>
                  </View>
                </Card>
              ))}
          </>
        )}
        
{filter === "cancelled" && (
          <>
            {/* Notice Card */}

            {sessionsLoading ? <ActivityIndicator style={{marginTop: 40}} /> : cancelledSessions.length === 0 ? <Text style={{textAlign: 'center', marginTop: 40}}>No cancelled sessions</Text> : cancelledSessions.map(session => (
              <Card key={session.id} style={styles.sessionCard}>
                <View style={styles.cardTopRow}>
                  <View style={styles.cancelledPill}>
                    <View style={styles.cancelledDot} />
                    <Text style={styles.cancelledStatusText}>Cancelled • {session.startAt.toDate().toLocaleDateString('en-LK', { timeZone: 'Asia/Colombo', month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                  </View>
                  <Text style={styles.refText}>Ref: {`#${session.id.substring(0, 5).toUpperCase()}`}</Text>
                </View>

                <View style={styles.doctorInfo}>
                  <Image source={{ uri: "https://i.pravatar.cc/150?u=" + session.counsellorId }} style={styles.doctorAvatar} />
                  <View style={styles.doctorDetails}>
                    <View style={styles.doctorNameRowSpace}>
                      <View style={styles.doctorNameRow}>
                        <Text style={styles.doctorName}>{(counsellors.find(c => c.uid === session.counsellorId)?.fullName || "Counselor")}</Text>
                        <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.originalSlotBox}>
                  <View style={styles.originalSlotHeaderRow}>
                    <View style={styles.calendarIconBox}>
                      <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={styles.originalSlotLabel}>Original Slot</Text>
                      <Text style={styles.originalSlotTime}>{session.startAt.toDate().toLocaleDateString('en-LK', { timeZone: 'Asia/Colombo', month: 'short', day: 'numeric', year: 'numeric' })} • {session.startAt.toDate().toLocaleTimeString('en-LK', { hour: "2-digit", minute: "2-digit", timeZone: 'Asia/Colombo' })}</Text>
                    </View>
                  </View>
                  <View style={styles.reasonRow}>
                    <Text style={styles.reasonLabel}>Reason: </Text>
                    <Text style={styles.reasonText}>{session.cancelReason || "User Cancellation"}</Text>
                  </View>
                </View>

                <Button title={"Rebook with " + (counsellors.find(c => c.uid === session.counsellorId)?.fullName || "Counselor").split(" ")[0]} icon="calendar-outline" onPress={() => router.push({ pathname: "/(student)/session/book", params: { uid: session.counsellorId }})} style={styles.rebookButton} />
              </Card>
            ))}
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
                <Text style={styles.showingText}>
                  {filteredCounsellors.length === counsellors.length ? 'Total ' : 'Showing '}
                  <Text style={{fontWeight: '700'}}>
                    {filteredCounsellors.length}
                    {filteredCounsellors.length !== counsellors.length ? ` of ${counsellors.length}` : ''} counselor{filteredCounsellors.length !== 1 ? 's' : ''}
                  </Text>
                </Text>
              </View>

            {loading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : filteredCounsellors.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Ionicons name="search-outline" size={40} color={colors.textSecondary} />
                <Text style={{ marginTop: 10, color: colors.textSecondary }}>No counselors found</Text>
              </View>
            ) : (
              filteredCounsellors.map((counselor) => {
                const mockData = getMockData(counselor.uid);
                return (
                  <Card key={counselor.uid} style={styles.findCard}>
                    <View style={styles.findCardTop}>
                      <View style={styles.findAvatar}><CounsellorAvatar uid={counselor.uid} name={counselor.fullName} size={64} /></View>
                      <View style={styles.findDetails}>
                        <Text style={styles.findName}>{counselor.fullName}</Text>
                        <Text style={styles.findSpecialty}>Specialty: {counselor.specialties.join(' & ')}</Text>
                        <View style={styles.findRatingRow}>
    <Text style={styles.findRating}>{counselor.experienceYears} years experience</Text>
    <Text style={styles.findAvailability}>{counselor.isAvailable ? 'Available' : 'Currently Unavailable'}</Text>
  </View>
                      </View>
                    </View>
                    <View style={styles.findCardBottom}>
                      <View style={styles.nextTimeRow}>
                          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                          <Text style={styles.nextTimeText}>
                            {counselor.isAvailable && counselor.availableSlots && counselor.availableSlots.length > 0 ? `Next: ${counselor.availableSlots[0]}` : 'No upcoming slots'}
                          </Text>
                        </View>
                      <Pressable style={styles.viewProfileBtn} onPress={() => router.push({ pathname: "/(student)/session/counselor", params: { uid: counselor.uid } })}>
                        <Text style={styles.viewProfileText}>View Profile</Text>
                        <Ionicons name="arrow-forward" size={16} color="#FFF" />
                      </Pressable>
                    </View>
                  </Card>
                );
              })
            )}
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
    // Keeps the right-hand icon clear of the floating crisis help button
    paddingRight: FLOATING_HELP_CLEARANCE,
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
    padding: 0, // removed padding to allow top edge indicator
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardTopIndicator: {
    height: 4,
    backgroundColor: colors.primary,
    width: "100%",
  },
  cardContent: {
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
    backgroundColor: "#E6F5EC",
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
    fontWeight: "700",
    color: colors.primary,
  },
  refText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  doctorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatarContainer: {
    position: "relative",
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -6,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingVertical: 2,
    alignItems: "center",
  },
  verifiedText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: "700",
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
    color: colors.text,
  },
  sessionDetailsBox: {
    backgroundColor: "#F8FAF9",
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailTextBold: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  detailTextLight: {
    fontSize: 14,
    fontWeight: "400",
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
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  infoBadgeTextDark: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "600",
  },
  joinBtn: {
    marginTop: spacing.xs,
    width: "100%",
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
  },
  rescheduleBtn: {
    borderColor: colors.primary,
    backgroundColor: "#F4FAF6",
  },
  rescheduleText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  cancelBtn: {
    borderColor: "#F4D8D8",
    backgroundColor: "#FFF5F5",
  },
  cancelText: {
    color: "#B74646",
    fontWeight: "600",
    fontSize: 14,
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
