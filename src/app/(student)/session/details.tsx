import { colors, radius, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Booking, SESSION_TYPE_LABELS } from "@/types/booking";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/firebase/config";
import { CounsellorProfile } from "@/types/counsellor";
import CounsellorAvatar from "@/components/common/CounsellorAvatar";
import { ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "@/components/common/Card";
import { useAuth } from "@/context/AuthContext";

export default function SessionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [session, setSession] = useState<Booking | null>(null);
  const [counsellor, setCounsellor] = useState<CounsellorProfile | null>(null);
  const [previousSessions, setPreviousSessions] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!id) {
      setLoadError("This session link is missing its booking ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    return onSnapshot(
      doc(db, "bookings", id),
      (snapshot) => {
        if (!snapshot.exists()) {
          setSession(null);
          setLoadError("This booking could not be found.");
        } else {
          setSession({ ...(snapshot.data() as Omit<Booking, "id">), id: snapshot.id });
          setLoadError(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("[session/details] Booking subscription failed:", error);
        setLoadError("Unable to load this booking. Please return to your schedule and try again.");
        setLoading(false);
      },
    );
  }, [id]);

  useEffect(() => {
    if (!session?.counsellorId) {
      setCounsellor(null);
      return;
    }

    return onSnapshot(
      doc(db, "counsellors", session.counsellorId),
      (snapshot) => {
        setCounsellor(
          snapshot.exists()
            ? ({ ...(snapshot.data() as Omit<CounsellorProfile, "uid">), uid: snapshot.id } as CounsellorProfile)
            : null,
        );
      },
      (error) => {
        console.error("[session/details] Counsellor subscription failed:", error);
      },
    );
  }, [session?.counsellorId]);

  useEffect(() => {
    if (!user || !session?.counsellorId) {
      setPreviousSessions([]);
      return;
    }

    const q = query(
      collection(db, "bookings"),
      where("studentId", "==", user.uid),
      where("counsellorId", "==", session.counsellorId),
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const sessionsForDoctor = snapshot.docs
          .map((docSnap) => ({ ...(docSnap.data() as Omit<Booking, "id">), id: docSnap.id }))
          .filter((booking) => booking.status === "completed")
          .sort((a, b) => (b.startAt?.toMillis?.() ?? 0) - (a.startAt?.toMillis?.() ?? 0));

        setPreviousSessions(sessionsForDoctor);
      },
      (error) => {
        console.error("[session/details] Previous sessions lookup failed:", error);
        setPreviousSessions([]);
      },
    );
  }, [session?.counsellorId, session?.id, user]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startAt = useMemo(
    () => session?.startAt?.toDate?.() ?? null,
    [session?.startAt],
  );
  const endAt = useMemo(
    () => session?.endAt?.toDate?.() ?? null,
    [session?.endAt],
  );
  const remainingSeconds = startAt
    ? Math.max(0, Math.floor((startAt.getTime() - now) / 1000))
    : 0;
  const countdown = {
    days: Math.floor(remainingSeconds / 86400),
    hours: Math.floor((remainingSeconds % 86400) / 3600),
    minutes: Math.floor((remainingSeconds % 3600) / 60),
    seconds: remainingSeconds % 60,
  };
  const countdownValues = [
    { value: countdown.days, label: "Days" },
    { value: countdown.hours, label: "Hours" },
    { value: countdown.minutes, label: "Mins" },
    { value: countdown.seconds, label: "Secs" },
  ];
  const dateTimeLabel = startAt
    ? new Intl.DateTimeFormat("en-LK", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Colombo",
      }).format(startAt)
    : "Date and time unavailable";
  const dateHeading = startAt
    ? new Intl.DateTimeFormat("en-LK", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Colombo",
      }).format(startAt)
    : "Date unavailable";
  const timeHeading = startAt
    ? new Intl.DateTimeFormat("en-LK", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Colombo",
      }).format(startAt)
    : "Time unavailable";
  const statusLabel = session
    ? session.status.charAt(0).toUpperCase() + session.status.slice(1)
    : "";
  const isJoinable = session?.status === "confirmed" && Boolean(
    startAt &&
    endAt &&
    now >= startAt.getTime() - 5 * 60 * 1000 &&
    now <= endAt.getTime()
  );
  const sessionTypeTitle = SESSION_TYPE_LABELS[session?.sessionType || "video"];
  const joinRoute = session?.sessionType === "chat"
    ? "/(student)/session/chat"
    : session?.sessionType === "video"
      ? "/(student)/session/video-call"
      : null;

  if (loading) {
    return <SafeAreaView style={styles.container}><ActivityIndicator style={{marginTop: 100}} /></SafeAreaView>;
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ textAlign: "center", marginTop: 100, color: colors.textSecondary }}>
          {loadError || "Session not found"}
        </Text>
        <Pressable onPress={() => router.replace("/(student)/session/dashboard")} accessibilityRole="button">
          <Text style={{ textAlign: "center", marginTop: spacing.md, color: colors.primary }}>Return to schedule</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => { if (router.canGoBack()) { router.back(); } else { router.push("/(student)/session/dashboard"); } }} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.topLabelText}>SESSION DETAILS</Text>
          
          <Text style={styles.mainTitle}>
            {session.status === "confirmed"
              ? "Upcoming Session Details"
              : session.status === "pending"
                ? "Booking Request Details"
                : "Session Details"}
          </Text>
          <Text style={styles.dateHeading}>{dateHeading}</Text>
          <Text style={styles.timeHeading}>{timeHeading}</Text>
          
          <View style={styles.statusRow}>
            <View style={[
              styles.statusPill,
              session.status !== "confirmed" && styles.statusPillInactive,
            ]}>
              <View style={styles.statusDot} />
              <Text style={styles.statusPillText}>
                {statusLabel}{session.status === "confirmed" && startAt && startAt.getTime() > now
                  ? ` • ${countdown.days > 0
                      ? `In ${countdown.days} day${countdown.days === 1 ? "" : "s"}`
                      : countdown.hours > 0
                        ? `In ${countdown.hours} hour${countdown.hours === 1 ? "" : "s"}`
                        : "Starting soon"}`
                  : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* Doctor Card */}
        <Card style={styles.doctorCard}>
          <View style={styles.doctorInfoRow}>
            <View style={styles.avatarContainer}>
              <CounsellorAvatar
                uid={session.counsellorId}
                name={counsellor?.fullName || "Counsellor"}
                size={60}
              />
            </View>
            <View style={styles.doctorDetails}>
              <View style={styles.doctorNameRow}>
                <Text style={styles.doctorName}>{counsellor?.fullName || "Counsellor"}</Text>
              </View>
              {counsellor?.title ? <Text style={styles.doctorSubtitle}>{counsellor.title}</Text> : null}
              {counsellor?.specialties?.length ? (
                <Text style={styles.doctorSpecialty}>Specialties: {counsellor.specialties.join(", ")}</Text>
              ) : null}
            </View>
          </View>
        </Card>

        {/* Countdown Card */}
        {session.status === "pending" || session.status === "confirmed" ? (
        <Card style={styles.countdownCard}>
          <View style={styles.cardHeaderBetween}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={styles.cardTitle}>
                {startAt && endAt && now >= startAt.getTime() && now <= endAt.getTime()
                  ? "SESSION IN PROGRESS"
                  : "SESSION STARTS IN"}
              </Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>
                {startAt && endAt && now >= startAt.getTime() && now <= endAt.getTime()
                  ? "LIVE"
                  : session.status === "pending"
                    ? "PENDING"
                    : session.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.countdownBoxes}>
            {countdownValues.map(({ value, label }) => (
              <View key={label} style={styles.timeBox}>
                <Text style={styles.timeNumber}>{String(value).padStart(2, "0")}</Text>
                <Text style={styles.timeLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} style={styles.infoIcon} />
            <Text style={styles.infoText}>
              {session.status === "confirmed"
                ? "Waiting room unlocks 5 minutes before the appointment"
                : "The counsellor must confirm this booking before joining"}
            </Text>
          </View>
        </Card>
        ) : null}

        {session.notes && session.notes !== "ANONYMOUS_BOOKING" ? (
          <Card style={styles.intakeCard}>
            <Text style={styles.cardTitleDark}>Your booking note</Text>
            <Text style={styles.intakeItemSub}>
              {session.notes.replace(/^ANONYMOUS:\s*/, "")}
            </Text>
          </Card>
        ) : null}

        <Card style={styles.historyCard}>
          <Text style={styles.cardTitle}>Previous sessions with this doctor</Text>
          {previousSessions.length > 0 ? (
            previousSessions.map((previousSession) => {
              const previousStartAt = previousSession.startAt?.toDate?.();
              const previousDate = previousStartAt
                ? new Intl.DateTimeFormat("en-LK", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: "Asia/Colombo",
                  }).format(previousStartAt)
                : "Date unavailable";
              const previousTime = previousStartAt
                ? new Intl.DateTimeFormat("en-LK", {
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: "Asia/Colombo",
                  }).format(previousStartAt)
                : "Time unavailable";

              return (
                <View key={previousSession.id} style={styles.previousSessionRow}>
                  <View style={styles.previousSessionDetails}>
                    <Text style={styles.previousSessionDate}>{previousDate}</Text>
                    <Text style={styles.previousSessionTime}>{previousTime}</Text>
                  </View>
                  <View style={styles.previousSessionTypeBadge}>
                    <Text style={styles.previousSessionType}>
                      {SESSION_TYPE_LABELS[previousSession.sessionType]}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.noPreviousSessions}>
              Completed sessions with this doctor will appear here.
            </Text>
          )}
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFBF7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "#FDFBF7",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  titleSection: {
    marginBottom: spacing.md,
  },
  topLabelText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  dateHeading: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.primary,
    lineHeight: 32,
    marginBottom: 4,
  },
  timeHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#A3D9B1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 6,
  },
  statusPillInactive: {
    backgroundColor: "#F3F0E6",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  doctorCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  historyCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  previousSessionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  previousSessionDetails: {
    flex: 1,
  },
  previousSessionDate: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  previousSessionTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  previousSessionTypeBadge: {
    backgroundColor: "#F3F0E6",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  previousSessionType: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  noPreviousSessions: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingTop: spacing.sm,
  },
  doctorInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  doctorDetails: {
    flex: 1,
  },
  doctorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  verifiedTextBadge: {
    backgroundColor: "#A3D9B1",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedTextBadgeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },
  doctorSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  doctorSpecialty: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "500",
  },
  countdownCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeaderBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  cardTitleDark: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#A3D9B1",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  countdownBoxes: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  timeBox: {
    width: "23%",
    backgroundColor: "#F3F0E6",
    paddingVertical: 12,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  timeNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  timeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  intakeCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  intakeList: {
    gap: spacing.sm,
  },
  intakeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDFBF7",
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  intakeCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#A3D9B1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  intakeItemTextContainer: {
    flex: 1,
  },
  intakeItemTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  intakeItemSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bottomActionsArea: {
    marginBottom: spacing.xl,
  },
  joinDisabledBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E1D8",
    paddingVertical: 16,
    borderRadius: radius.full,
    gap: 8,
    marginBottom: spacing.sm,
  },
  actionDisabled: {
    opacity: 0.55,
  },
  sessionModeNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: "#F3F0E6",
    borderRadius: radius.md,
  },
  joinDisabledText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  splitBtnRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  rescheduleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: radius.full,
    gap: 6,
  },
  rescheduleBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FCE8E8",
    paddingVertical: 14,
    borderRadius: radius.full,
    gap: 6,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.danger,
  },
  bottomBar: {
    padding: spacing.md,
    backgroundColor: "#FDFBF7",
    paddingBottom: spacing.xl,
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.full,
    gap: 8,
  },
  continueText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
});
