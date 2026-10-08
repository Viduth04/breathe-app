import { FLOATING_HELP_CLEARANCE } from "@/components/crisis/UrgentHelpLink";
import { useAuth } from "@/context/AuthContext";
import { colors, radius, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import CounsellorAvatar from "@/components/common/CounsellorAvatar";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { doc, getDoc, collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/firebase/config";
import { ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View, Pressable, Modal, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "@/components/common/Card";
import { ACTIVE_STATUSES, type BookingStatus, type SessionType } from "@/types/booking";

type PublishedSlot = {
  id: string;
  dateKey: string;
  dateDisplay: string;
  startTime: string;
  endTime: string;
  startAt: Date;
  endAt: Date;
  sessionTypes: SessionType[];
  isBooked: boolean;
  unavailableReason?: "booked" | "daily-limit";
  bookingId?: string;
};

type StudentBookingStatus = {
  status: BookingStatus;
  dateKey: string;
  sessionType: SessionType;
  startAt: number;
  endAt: number;
};

const CLOCK_TIME_PATTERN = /^\d{1,2}:\d{2}\s*(?:AM|PM)$/i;

export default function CounselorProfileScreen() {
  const { uid, bookingId } = useLocalSearchParams<{ uid: string; bookingId?: string }>();
  const { profile } = useAuth();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });
  const selectedDateKeyRef = useRef(selectedDateKey);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [availableSlots, setAvailableSlots] = useState<PublishedSlot[]>([]);
  const [studentBookingStatuses, setStudentBookingStatuses] = useState<
    Record<string, StudentBookingStatus>
  >({});
  const [slotsLoading, setSlotsLoading] = useState(Boolean(uid));
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<PublishedSlot | null>(null);

  const getMockData = (cId: string) => {
    const charCode = cId.charCodeAt(0) || 0;
    return {
      rating: ((charCode % 5) * 0.1 + 4.5).toFixed(1),
      reviews: (charCode % 50) + 80,
      avatar: `https://i.pravatar.cc/150?u=${cId}`,
    };
  };
  const mockData = uid ? getMockData(uid as string) : null;
  const [counsellor, setCounsellor] = useState<any>(null);
  const [loading, setLoading] = useState(Boolean(uid));
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    if (!uid) {
      return;
    }

    let active = true;

    getDoc(doc(db, "counsellors", uid))
      .then((snap) => {
        if (active && snap.exists()) {
          setCounsellor({ id: snap.id, ...snap.data() });
        }
      })
      .catch((error) => {
        console.error("[counselor-profile] Failed to load counselor:", error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const slotsQuery = query(collection(db, "slots"), where("counsellorId", "==", uid));
    const unsubscribeSlots = onSnapshot(
      slotsQuery,
      (snapshot) => {
        const now = Date.now();
        const slots = snapshot.docs
          .map((slotDoc): PublishedSlot | null => {
            const data = slotDoc.data();
            
            if (!data.dateKey || !data.startTime) return null;
            
            const [year, month, day] = data.dateKey.split("-").map(Number);
            
            const parseTime = (timeStr: string) => {
              if (!timeStr) return { h: 0, m: 0 };
              const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
              if (!match) return { h: 0, m: 0 };
              let h = parseInt(match[1]);
              const m = parseInt(match[2]);
              if (match[3].toUpperCase() === "PM" && h < 12) h += 12;
              if (match[3].toUpperCase() === "AM" && h === 12) h = 0;
              return { h, m };
            };
            
            const sTime = parseTime(data.startTime);
            const eTime = parseTime(data.endTime);
            
            const startAt = new Date(year, month - 1, day, sTime.h, sTime.m);
            const endAt = new Date(year, month - 1, day, eTime.h || sTime.h + 1, eTime.m || sTime.m);

            // Don't show slots that have already passed
            if (startAt.getTime() < now) return null;

            return {
              id: slotDoc.id,
              dateKey: data.dateKey,
              dateDisplay: data.dateDisplay || data.dateKey,
              startTime: data.startTime,
              endTime: data.endTime || "",
              startAt,
              endAt,
              sessionTypes: data.sessionTypes || ["video"],
              isBooked: data.isBooked === true || data.status === "held" || data.status === "closed",
              unavailableReason: data.isBooked ? "booked" : undefined,
              bookingId: data.bookingId,
            };
          })
          .filter((s): s is PublishedSlot => s !== null);

        if (active) {
          setAvailableSlots(slots);
          setSlotsError(null);
          setSlotsLoading(false);
        }
      },
      (error) => {
        console.error("[counselor-profile] Slots subscription failed:", error);
        if (active) {
          setSlotsError("Failed to load availability.");
          setSlotsLoading(false);
        }
      }
    );

    const reviewsQuery = query(collection(db, "reviews"), where("counsellorId", "==", uid));
    const unsubscribeReviews = onSnapshot(
      reviewsQuery,
      (snapshot) => {
        if (active) {
          const revs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          revs.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
          setReviews(revs);
        }
      },
      (error) => {
        console.error("[counselor-profile] Reviews subscription failed:", error);
      }
    );

    return () => {
      active = false;
      unsubscribeSlots();
      unsubscribeReviews();
    };
  }, [uid]);

  useEffect(() => {
    if (!profile?.uid) {
      setStudentBookingStatuses({});
      return;
    }

    const studentBookingsQuery = query(
      collection(db, "bookings"),
      where("studentId", "==", profile.uid)
    );
    return onSnapshot(
      studentBookingsQuery,
      (snapshot) => {
        const statuses: Record<string, StudentBookingStatus> = {};
        for (const bookingDoc of snapshot.docs) {
          const booking = bookingDoc.data();
          const startAt =
            booking.startAt && typeof booking.startAt.toMillis === "function"
              ? booking.startAt.toMillis()
              : NaN;
          const endAt =
            booking.endAt && typeof booking.endAt.toMillis === "function"
              ? booking.endAt.toMillis()
              : NaN;
          const dateKey = typeof booking.dateKey === "string" ? booking.dateKey : "";
          const sessionType = booking.sessionType;
          if (
            Number.isFinite(startAt) &&
            Number.isFinite(endAt) &&
            ["in-person", "video", "phone", "chat"].includes(sessionType)
          ) {
            statuses[bookingDoc.id] = { status: booking.status, dateKey, sessionType, startAt, endAt };
          }
        }
        setStudentBookingStatuses(statuses);
      },
      (error) => {
        console.error("[counselor-profile] Failed to check the student's bookings:", error);
      }
    );
  }, [profile?.uid]);

  const calendarSlots = useMemo(() => {
    const unavailableDateKeys = new Set(
      Object.entries(studentBookingStatuses)
        .filter(([, booking]) => booking.status !== "cancelled" && booking.status !== "declined")
        .map(([bookingId, booking]) => {
          const linkedSlot = availableSlots.find((slot) => slot.bookingId === bookingId);
          if (linkedSlot) return linkedSlot.dateKey;
          if (booking.dateKey) return booking.dateKey;
          const date = new Date(booking.startAt);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        })
        .filter(Boolean),
    );

    return availableSlots.map((slot) => {
      const ownBooking = slot.bookingId
        ? studentBookingStatuses[slot.bookingId]
        : undefined;
      const isOwnedSlotActive = Boolean(
        ownBooking &&
          ACTIVE_STATUSES.includes(ownBooking.status) &&
          ownBooking.endAt > Date.now(),
      );
      const dailyLimitApplies = !bookingId && unavailableDateKeys.has(slot.dateKey);

      return {
        ...slot,
        isBooked: dailyLimitApplies || (ownBooking ? isOwnedSlotActive : slot.isBooked),
        ...(dailyLimitApplies && !isOwnedSlotActive
          ? { unavailableReason: "daily-limit" as const }
          : {}),
      };
    });
  }, [availableSlots, bookingId, studentBookingStatuses]);

  useEffect(() => {
    const selectedDateHasSlots = calendarSlots.some(
      (slot) => slot.dateKey === selectedDateKeyRef.current
    );
    if (calendarSlots.length > 0 && !selectedDateHasSlots) {
      const firstSlot = calendarSlots[0];
      selectedDateKeyRef.current = firstSlot.dateKey;
      setSelectedDateKey(firstSlot.dateKey);
      setCalendarMonth(
        new Date(firstSlot.startAt.getFullYear(), firstSlot.startAt.getMonth(), 1)
      );
    }
    setSelectedSlot((current) =>
      current && calendarSlots.some((slot) => slot.id === current.id && !slot.isBooked)
        ? calendarSlots.find((slot) => slot.id === current.id) || null
        : null
    );
  }, [calendarSlots]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const leadingDays = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: Array<Date | null> = Array.from({ length: leadingDays }, () => null);
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [calendarMonth]);

  const currentDate = new Date();
  const isCurrentOrPastMonth =
    calendarMonth.getFullYear() < currentDate.getFullYear() ||
    (calendarMonth.getFullYear() === currentDate.getFullYear() &&
      calendarMonth.getMonth() <= currentDate.getMonth());

  const selectedDateSlots = calendarSlots.filter((slot) => slot.dateKey === selectedDateKey);

  const renderDay = (date: Date | null, index: number) => {
    if (!date) {
      return (
        <View key={`empty-${index}`} style={styles.dayWrapper}>
          <View style={styles.dayBox} />
        </View>
      );
    }

    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const dateSlots = calendarSlots.filter((slot) => slot.dateKey === dateKey);
    const isAvailable = dateSlots.some((slot) => !slot.isBooked);
    const hasVisibleSlots = dateSlots.length > 0;
    const isSelected = selectedDateKey === dateKey;
    const boxStyle = [
      styles.dayBox,
      isAvailable ? styles.dayAvailable : styles.dayUnavailable,
      isSelected && styles.daySelected,
    ];
    const textStyle = [
      styles.dayText,
      !isAvailable && styles.dayTextUnavailable,
      isSelected && styles.dayTextSelected,
    ];

    return (
      <View key={dateKey} style={styles.dayWrapper}>
        <Pressable
          style={boxStyle}
          disabled={!hasVisibleSlots}
          onPress={() => {
            selectedDateKeyRef.current = dateKey;
            setSelectedDateKey(dateKey);
            setSelectedSlot(null);
          }}
          accessibilityRole="button"
          accessibilityLabel={`${date.toLocaleDateString("en-LK", { weekday: "long", month: "long", day: "numeric" })}${isAvailable ? ", available" : hasVisibleSlots ? ", fully booked" : ", unavailable"}`}
        >
          <Text style={textStyle}>{date.getDate()}</Text>
        </Pressable>
      </View>
    );
  };

  if (loading) {
    return <SafeAreaView style={styles.container}><ActivityIndicator style={{marginTop: 100}} />

      </SafeAreaView>;
  }

  
  if (!counsellor && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Counselor Not Found</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Text>We couldn't find this counselor's profile.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => { if (router.canGoBack()) { router.back(); } else { router.push("/(student)/session/dashboard"); } }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Counselor Booking</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Info (Centered) */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <CounsellorAvatar uid={counsellor?.uid || uid} name={counsellor?.fullName || "Counselor"} size={100} />
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
                    <Text style={styles.monthTitle}>
                      {new Intl.DateTimeFormat("en-LK", { month: "long", year: "numeric" }).format(calendarMonth)}
                    </Text>
                    <Text style={styles.monthSubtitle}>Select an available consultation day</Text>
                  </View>
                  <View style={styles.monthNav}>
                    <Pressable
                      style={[styles.navBtn, isCurrentOrPastMonth && { opacity: 0.35 }]}
                      disabled={isCurrentOrPastMonth}
                      onPress={() =>
                        setCalendarMonth((month) => {
                          const current = new Date();
                          const previousMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
                          if (
                            previousMonth.getFullYear() < current.getFullYear() ||
                            (previousMonth.getFullYear() === current.getFullYear() &&
                              previousMonth.getMonth() < current.getMonth())
                          ) {
                            return month;
                          }
                          return previousMonth;
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel="Previous month"
                    >
                      <Ionicons name="chevron-back" size={16} color={colors.text} />
                    </Pressable>
                    <Pressable
                      style={styles.navBtn}
                      onPress={() =>
                        setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))
                      }
                      accessibilityRole="button"
                      accessibilityLabel="Next month"
                    >
                      <Ionicons name="chevron-forward" size={16} color={colors.text} />
                    </Pressable>
                  </View>
                </View>

                {/* Days of week */}
                <View style={styles.weekDaysRow}>
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                    <Text key={`${day}-${i}`} style={styles.weekDayText}>{day}</Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {calendarDays.map((day, index) => renderDay(day, index))}
                </View>
              </View>
            )}

            <View style={[styles.slotsGrid, { marginTop: showCalendar ? 0 : 0 }]}>
              <View style={[styles.slotBox, styles.slotBoxActive, { width: "100%", marginBottom: 4 }]}>
                <Ionicons name="calendar-outline" size={16} color="#FFF" />
                <Text style={[styles.slotText, styles.slotTextActive]}>
                  {(() => {
                    const [year, month, day] = selectedDateKey.split("-").map(Number);
                    return new Intl.DateTimeFormat("en-LK", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    }).format(new Date(year, month - 1, day));
                  })()}
                </Text>
              </View>

              {slotsLoading ? (
                <ActivityIndicator style={{ paddingVertical: 24 }} color={colors.primary} />
              ) : slotsError ? (
                <Text style={{ color: colors.textSecondary, textAlign: "center", paddingVertical: 24 }}>
                  {slotsError}
                </Text>
              ) : selectedDateSlots.length > 0 ? (
                selectedDateSlots.map((slot) => (
                  <Pressable
                    key={slot.id}
                    style={[
                      styles.slotBox,
                      slot.isBooked && styles.slotBoxUnavailable,
                      selectedSlot?.id === slot.id && styles.slotBoxActive,
                    ]}
                    disabled={slot.isBooked}
                    onPress={() => setSelectedSlot(slot)}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: slot.isBooked }}
                    accessibilityLabel={`${slot.startTime} slot${slot.isBooked ? ", already booked" : ""}`}
                  >
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={slot.isBooked ? colors.textSecondary : selectedSlot?.id === slot.id ? "#FFF" : colors.primary}
                    />
                    <Text
                      style={[
                        styles.slotText,
                        slot.isBooked && styles.slotTextUnavailable,
                        selectedSlot?.id === slot.id && styles.slotTextActive,
                      ]}
                    >
                      {slot.startTime}{slot.endTime ? ` – ${slot.endTime}` : ""}{slot.isBooked ? (slot.unavailableReason === "daily-limit" ? " • Daily limit" : " • Booked") : ""}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <View style={{ width: "100%", alignItems: "center", paddingVertical: 24 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                    {availableSlots.length
                      ? "No slots available for this day. Select a highlighted date."
                      : "No slots available for this counselor yet."}
                  </Text>
                </View>
              )}
            </View>
          </Card>

        {/* Reviews Card */}
        <Pressable onPress={() => setShowReviews(true)}>
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderBetween}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.titleLine} />
              <Text style={styles.sectionTitle}>Reviews</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={styles.totalReviewsBadge}>
                <Text style={styles.totalReviewsText}>Total: {reviews.length}</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>See All</Text>
              <Ionicons name="arrow-forward" size={12} color={colors.primary} />
            </View>
          </View>
          {reviews.length === 0 ? (
            <Text style={{color: colors.textSecondary, alignSelf: 'center', marginVertical: 20}}>No reviews yet.</Text>
          ) : (
            reviews.slice(0, 4).map((item, idx) => (
              <View key={item.id}>
                <View style={styles.reviewItem}>
                  <View style={styles.starsRow}>
                    {[1,2,3,4,5].map(star => (
                      <Ionicons 
                        key={star} 
                        name={star <= item.rating ? "star" : "star-outline"} 
                        size={14} 
                        color={star <= item.rating ? "#F59E0B" : "#D1D5DB"} 
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewText}>
                    "${item.feedback || 'Great session.'}" <Text style={styles.reviewerName}>— ${item.studentId === "Anonymous" ? "Anonymous" : "Student"}</Text>
                  </Text>
                </View>
                {idx < 3 && reviews.length > (idx + 1) && <View style={styles.reviewDivider} />}
              </View>
            ))
          )}
</Card>
        </Pressable>

      </ScrollView>

      {/* Bottom Fixed Bar */}
      <View style={styles.bottomBar}>
        
        <Pressable 
            style={[styles.bookSessionBtn, !selectedSlot && { opacity: 0.5 }]}
            disabled={!selectedSlot}
            onPress={() => selectedSlot && router.push({
              pathname: "/(student)/session/book",
              params: {
                uid: counsellor?.id,
                ...(bookingId ? { bookingId } : {}),
                slotId: selectedSlot.id,
                dateKey: selectedSlot.dateKey,
                time: selectedSlot.startTime,
                startAt: selectedSlot.startAt.toISOString(),
                endAt: selectedSlot.endAt.toISOString(),
                sessionType:
                  bookingId &&
                  selectedSlot.sessionTypes.includes(
                    studentBookingStatuses[bookingId]?.sessionType,
                  )
                    ? studentBookingStatuses[bookingId].sessionType
                    : selectedSlot.sessionTypes[0] || "video",
                sessionTypes: selectedSlot.sessionTypes.join(","),
              },
            })}
          >
            <Ionicons name="calendar-outline" size={20} color="#FFF" style={styles.bookSessionIcon} />
            <View style={styles.bookSessionContent}>
              <Text style={styles.bookSessionText}>
                {bookingId ? "New Time" : "Book Session"}
              </Text>
            </View>
          </Pressable>
      </View>
    
      {/* Reviews Modal */}
      <Modal visible={showReviews} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937' }}>All Reviews</Text>
              <Pressable onPress={() => setShowReviews(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color="#4B5563" />
              </Pressable>
            </View>
            
            <FlatList 
              data={reviews}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 40, color: '#9CA3AF'}}>No reviews available.</Text>}
              renderItem={({ item }) => (
                <View style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                  <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Ionicons 
                        key={star} 
                        name={star <= item.rating ? "star" : "star-outline"} 
                        size={16} 
                        color={star <= item.rating ? "#F59E0B" : "#D1D5DB"} 
                        style={{ marginRight: 2 }}
                      />
                    ))}
                  </View>
                  <Text style={{ fontSize: 15, color: '#374151', fontStyle: 'italic', marginBottom: 8, lineHeight: 22 }}>"${item.feedback || 'Great session.'}"</Text>
                  <Text style={{ fontSize: 13, color: '#9CA3AF' }}>— ${item.studentId === "Anonymous" ? "Anonymous" : "Student"}</Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
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
    // Keeps the right-hand icon clear of the floating crisis help button
    paddingRight: FLOATING_HELP_CLEARANCE,
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
  slotBoxUnavailable: {
    backgroundColor: "#ECECEC",
    borderColor: "#E0E0E0",
    opacity: 0.5,
  },
  slotText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  slotTextActive: {
    color: "#FFF",
  },
  slotTextUnavailable: {
    color: "#7B7B7B",
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
    position: "relative",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  bookSessionIcon: {
    position: "absolute",
    left: 8,
  },
  bookSessionContent: {
    flex: 1,
    alignItems: "center",
  },
  bookSessionText: {
    fontWeight: "600",
    fontSize: 16,
    lineHeight: 19,
    color: "#FFF",
    textAlign: "center",
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
