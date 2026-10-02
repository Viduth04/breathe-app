// Layout scaffold by Viduth (Member 1).
// Owner: Ishara (FR02, FR06) - connects data and check-in logic.

import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Screen from "@/components/common/Screen";
import { useAuth } from "@/context/AuthContext";
import { MoodLevel, MOODS } from "@/types/checkin";
import {
  colors,
  moodColors,
  radius,
  spacing,
  TOUCH_TARGET,
  typography,
} from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Session = {
  counsellorName: string;
  date: string;
  time: string;
  anonymous: boolean;
};

type Resource = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  meta: string;
};

// DUMMY DATA - Ishara: replace with Firestore data (checkins, bookings, resources)
const DUMMY: {
  week: { day: string; fullDay: string; mood: MoodLevel | null }[];
  upcomingSession: Session | null;
  resources: Resource[];
} = {
  week: [
    { day: "Mon", fullDay: "Monday", mood: 3 },
    { day: "Tue", fullDay: "Tuesday", mood: 4 },
    { day: "Wed", fullDay: "Wednesday", mood: 2 },
    { day: "Thu", fullDay: "Thursday", mood: null }, // No check-in that day
    { day: "Fri", fullDay: "Friday", mood: 4 },
    { day: "Sat", fullDay: "Saturday", mood: 5 },
    { day: "Sun", fullDay: "Sunday", mood: 3 },
  ],
  upcomingSession: {
    counsellorName: "Dr. Nimali Perera",
    date: "Thu, 2 Oct",
    time: "3:00 PM",
    anonymous: true,
  },
  resources: [
    {
      id: "box-breathing",
      icon: "leaf-outline",
      title: "Box breathing",
      meta: "3 min exercise",
    },
    {
      id: "exam-stress",
      icon: "book-outline",
      title: "Coping with exam stress",
      meta: "5 min read",
    },
  ],
};

const moodLabel = (level: MoodLevel) => MOODS[level - 1].label;

export default function Home() {
  const { profile } = useAuth();
  const firstName =
    !profile || profile.isGuest || !profile.fullName.trim()
      ? "there"
      : profile.fullName.trim().split(/\s+/)[0];
  const session = DUMMY.upcomingSession;

  const goToCheckIn = () => router.navigate("/(student)/check-in");
  // A tapped face opens check-in with that mood already selected
  const checkInAs = (mood: MoodLevel) =>
    router.navigate({
      pathname: "/(student)/check-in",
      params: { mood: String(mood) },
    });
  const goToSessions = () => router.navigate("/(student)/session/dashboard");
  const goToExercises = () => router.navigate("/(student)/exercises");

  return (
    <Screen>
      {/* 1. Greeting */}
      <View style={styles.greeting}>
        <Text style={typography.title} accessibilityRole="header">
          Hi, {firstName}
        </Text>
        <Text style={[typography.body, styles.muted]}>
          How are you feeling today?
        </Text>
      </View>

      {/* 2. Mood check-in: the one dominant action on this screen (R1, fixes F1) */}
      <Card variant="success">
        <Text style={typography.heading}>Daily check-in</Text>
        <Text style={[typography.caption, styles.cardSubtitle]}>
          Tap a face or check in below
        </Text>
        <View style={styles.faces}>
          {MOODS.map((mood) => (
            // Faces open the same check-in flow as the button, so they don't compete with it
            <Pressable
              key={mood.level}
              onPress={() => checkInAs(mood.level)}
              accessibilityRole="button"
              accessibilityLabel={`Check in as ${mood.label}`}
              style={({ pressed }) => [styles.face, pressed && styles.pressed]}
            >
              <Text style={styles.faceEmoji}>{mood.emoji}</Text>
            </Pressable>
          ))}
        </View>
        <Button title="Check In Now" onPress={goToCheckIn} />
      </Card>

      {/* 3. This week's mood */}
      <Card>
        <Text style={typography.heading}>This week's mood</Text>
        <View style={styles.week}>
          {DUMMY.week.map(({ day, fullDay, mood }) => (
            <View
              key={day}
              style={styles.day}
              accessible
              accessibilityLabel={`${fullDay}: ${mood ? moodLabel(mood) : "no check-in"}`}
            >
              <View
                style={[
                  styles.dot,
                  mood
                    ? { backgroundColor: moodColors[mood - 1] }
                    : styles.dotEmpty,
                ]}
              />
              <Text style={typography.caption}>{day}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* 4. Upcoming session */}
      {session ? (
        <Card>
          <View style={styles.sessionHeader}>
            <Text style={typography.heading}>Upcoming session</Text>
            {session.anonymous ? (
              <View style={styles.badge}>
                <Ionicons
                  name="eye-off-outline"
                  size={12}
                  color={colors.primary}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
                <Text style={styles.badgeText}>Anonymous</Text>
              </View>
            ) : null}
          </View>
          <Text style={[typography.body, styles.sessionName]}>
            {session.counsellorName}
          </Text>
          <View style={styles.sessionTime}>
            <Ionicons
              name="time-outline"
              size={16}
              color={colors.textSecondary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={typography.caption}>
              {session.date} · {session.time}
            </Text>
          </View>
          <Button
            title="View Sessions"
            variant="secondary"
            onPress={goToSessions}
          />
        </Card>
      ) : null}
      {/* Empty state - use this when there is no upcoming session:
      {!session ? (
        <Card>
          <Text style={typography.heading}>Upcoming session</Text>
          <Text style={[typography.body, styles.muted, styles.emptyText]}>
            You have no sessions booked. Talking to a counsellor is free and
            private.
          </Text>
          <Button
            title="Book a Session"
            variant="secondary"
            onPress={goToSessions}
          />
        </Card>
      ) : null}
      */}

      {/* 5. Need support? */}
      <Pressable
        onPress={goToSessions}
        accessibilityRole="link"
        accessibilityLabel="Need support? Get support from a counsellor"
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <Card style={styles.row}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={22}
            color={colors.primary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Need support?</Text>
            <Text style={typography.caption}>
              Talk to a counsellor privately
            </Text>
          </View>
          <Text style={styles.link}>Get support</Text>
        </Card>
      </Pressable>

      {/* 6. Resources */}
      <View style={styles.sectionHeader}>
        <Text style={typography.heading} accessibilityRole="header">
          Resources
        </Text>
        <Pressable
          onPress={goToExercises}
          accessibilityRole="link"
          accessibilityLabel="See all resources"
          style={styles.seeAll}
        >
          <Text style={styles.link}>See all</Text>
        </Pressable>
      </View>
      {DUMMY.resources.map((item) => (
        <Pressable
          key={item.id}
          onPress={goToExercises}
          accessibilityRole="link"
          accessibilityLabel={`${item.title}, ${item.meta}`}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Card style={styles.row}>
            <View style={styles.resourceIcon}>
              <Ionicons
                name={item.icon}
                size={20}
                color={colors.primary}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={typography.caption}>{item.meta}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textSecondary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { gap: spacing.xs, marginBottom: spacing.lg },
  muted: { color: colors.textSecondary },
  cardSubtitle: { marginTop: spacing.xs },
  faces: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: spacing.md,
  },
  face: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  faceEmoji: { fontSize: 26 },
  pressed: { opacity: 0.7 },
  week: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  day: { alignItems: "center", gap: spacing.xs, minWidth: 32 },
  dot: {
    width: 16,
    height: 16,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border, // Keeps the pale mood colors visible on white
  },
  dotEmpty: {
    backgroundColor: "transparent",
    borderStyle: "dashed",
    borderColor: colors.textSecondary,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.selected,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 12, fontWeight: "600", color: colors.primary },
  sessionName: { marginTop: spacing.sm, fontWeight: "600" },
  emptyText: { marginVertical: spacing.sm },
  sessionTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: TOUCH_TARGET,
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { ...typography.body, fontWeight: "600" },
  link: { fontSize: 14, fontWeight: "600", color: colors.primary },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  seeAll: {
    minHeight: TOUCH_TARGET,
    minWidth: TOUCH_TARGET,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
});
