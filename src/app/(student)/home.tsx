// Home dashboard - Ishara (Member 2). FR02, FR06.
// Layout scaffold by Viduth (Member 1).
//
// Each card loads on its own and fails on its own, so one error never blanks
// the whole Home. Everything refreshes when the student comes back to Home.

import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Screen from "@/components/common/Screen";
import { openResource, resourceMeta } from "@/components/resources/ResourceCard";
import { useAuth } from "@/context/AuthContext";
import { getAuthErrorMessage } from "@/services/authService";
import { listMyCheckins, moodByDay } from "@/services/checkinService";
import { getUpcomingBooking, UpcomingBooking } from "@/services/homeService";
import { listReminders } from "@/services/reminderService";
import { listPublishedResources } from "@/services/resourceService";
import {
  colors,
  moodColors,
  radius,
  spacing,
  TOUCH_TARGET,
  typography,
} from "@/theme";
import { CheckIn, MoodLevel, MOODS } from "@/types/checkin";
import type { Resource } from "@/types/resource";
import { dateKey, weekStartDate } from "@/utils/week";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { ReactNode, useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

const HOME_RESOURCES = 2;

type CardState<T> = { data?: T; loading: boolean; error?: string };

// One card's data: spinner only on the first load, quiet refresh after that
function useCardData<T>(loader: () => Promise<T>) {
  const [state, setState] = useState<CardState<T>>({ loading: true });
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: s.data === undefined, error: undefined }));
    try {
      const data = await loaderRef.current();
      setState({ data, loading: false });
    } catch (e) {
      console.warn("Home card failed to load", e);
      setState((s) => ({ ...s, loading: false, error: getAuthErrorMessage(e) }));
    }
  }, []);

  return { ...state, load };
}

const moodLabel = (level: MoodLevel) => MOODS[level - 1].label;

// Mon-Sun of the current week (future days are simply empty)
function thisWeek(list: CheckIn[]) {
  const sunday = weekStartDate();
  sunday.setDate(sunday.getDate() + 6);
  return moodByDay(list, 7, sunday);
}

const sessionDate = (d: Date) =>
  d.toLocaleDateString('en-LK', { timeZone: 'Asia/Colombo', weekday: "short", day: "numeric", month: "short" });
const sessionTime = (d: Date) =>
  d.toLocaleTimeString('en-LK', { timeZone: 'Asia/Colombo', hour: "numeric", minute: "2-digit" });

export default function Home() {
  const { user, profile } = useAuth();
  const firstName =
    !profile || profile.isGuest || !profile.fullName.trim()
      ? "there"
      : profile.fullName.trim().split(/\s+/)[0];

  // Check-in card and week card share one read (this week's check-ins)
  const checkins = useCardData(() => listMyCheckins({ days: 7 }));
  const booking = useCardData<UpcomingBooking | null>(() =>
    user ? getUpcomingBooking(user.uid) : Promise.resolve(null),
  );
  const resources = useCardData<Resource[]>(async () =>
    (await listPublishedResources()).slice(0, HOME_RESOURCES),
  );
  // Only decides whether to offer "Set a reminder"; failing just hides it
  const reminders = useCardData<number>(async () =>
    user ? (await listReminders(user.uid)).length : 0,
  );

  // Initial load and every return to Home, so a new check-in or booking shows
  useFocusEffect(
    useCallback(() => {
      checkins.load();
      booking.load();
      resources.load();
      reminders.load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const todayKey = dateKey(new Date());
  const today = checkins.data?.find((c) => c.dateKey === todayKey) ?? null;
  const week = thisWeek(checkins.data ?? []);
  const session = booking.data;

  const goToCheckIn = () => router.navigate("/(student)/check-in");
  // A tapped face opens check-in with that mood already selected
  const checkInAs = (mood: MoodLevel) =>
    router.navigate({
      pathname: "/(student)/check-in",
      params: { mood: String(mood) },
    });
  const editCheckIn = () =>
    router.navigate({ pathname: "/(student)/check-in", params: { edit: "1" } });
  const goToMoodHistory = () => router.navigate("/(student)/mood-history");
  const goToSessions = () => router.navigate("/(student)/session/dashboard");
  const goToExercises = () => router.navigate("/(student)/exercises");
  const goToReminders = () => router.navigate("/(student)/reminders");

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
        <CardBody state={checkins} label="today's check-in">
          {today ? (
            <>
              <View
                style={styles.todayMood}
                accessible
                accessibilityLabel={`You've checked in today. Today's mood: ${moodLabel(today.mood)}`}
              >
                <Text style={styles.todayEmoji}>{MOODS[today.mood - 1].emoji}</Text>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>You've checked in today</Text>
                  <Text style={typography.caption}>
                    Today's mood: {moodLabel(today.mood)}
                  </Text>
                </View>
              </View>
              <Button
                title="Edit"
                variant="secondary"
                icon="create-outline"
                onPress={editCheckIn}
              />
            </>
          ) : (
            <>
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
            </>
          )}
        </CardBody>
        {reminders.data === 0 && !reminders.error ? (
          <Pressable
            onPress={goToReminders}
            accessibilityRole="link"
            accessibilityLabel="Set a reminder"
            accessibilityHint="Choose a time for a gentle daily check-in reminder"
            style={({ pressed }) => [styles.reminderLink, pressed && styles.pressed]}
          >
            <Ionicons
              name="alarm-outline"
              size={18}
              color={colors.primary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={styles.link}>Set a reminder</Text>
          </Pressable>
        ) : null}
      </Card>

      {/* 3. This week's mood */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={typography.heading}>This week's mood</Text>
          <Pressable
            onPress={goToMoodHistory}
            accessibilityRole="link"
            accessibilityLabel="Mood history"
            style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}
          >
            <Text style={styles.link}>Mood history</Text>
          </Pressable>
        </View>
        <CardBody state={checkins} label="this week's mood">
          <View style={styles.week}>
            {week.map(({ dateKey: key, date, mood }) => {
              const fullDay = date.toLocaleDateString('en-LK', { weekday: "long", timeZone: 'Asia/Colombo' });
              const isToday = key === todayKey;
              return (
                <View
                  key={key}
                  style={styles.day}
                  accessible
                  accessibilityLabel={`${isToday ? "Today, " : ""}${fullDay}: ${mood ? moodLabel(mood) : "no check-in"}`}
                >
                  <View
                    style={[
                      styles.dot,
                      mood ? { backgroundColor: moodColors[mood - 1] } : styles.dotEmpty,
                    ]}
                  />
                  <Text style={[typography.caption, isToday && styles.todayLabel]}>
                    {date.toLocaleDateString('en-LK', { weekday: "short", timeZone: 'Asia/Colombo' })}
                  </Text>
                </View>
              );
            })}
          </View>
        </CardBody>
      </Card>

      {/* 4. Upcoming session */}
      <Card>
        <View style={styles.sessionHeader}>
          <Text style={typography.heading}>Upcoming session</Text>
          {session && profile?.anonymousMode ? (
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
        <CardBody state={booking} label="your next session">
          {session ? (
            <>
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
                  {sessionDate(session.startAt)} · {sessionTime(session.startAt)}
                  {session.status === "pending" ? " · Awaiting confirmation" : ""}
                </Text>
              </View>
              <Button title="View Sessions" variant="secondary" onPress={goToSessions} />
            </>
          ) : (
            <>
              <Text style={[typography.body, styles.muted, styles.emptyText]}>
                You have no sessions booked. Talking to a counsellor is free and
                private.
              </Text>
              <Button title="Book a session" variant="secondary" onPress={goToSessions} />
            </>
          )}
        </CardBody>
      </Card>

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
      {resources.loading || resources.error ? (
        <Card>
          <CardBody state={resources} label="resources" />
        </Card>
      ) : resources.data?.length ? (
        resources.data.map((item) => {
          const meta = resourceMeta(item);
          return (
            <Pressable
              key={item.id}
              onPress={() => openResource(item.id)}
              accessibilityRole="link"
              accessibilityLabel={`${item.title}, ${meta}`}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Card style={styles.row}>
                <View style={styles.resourceIcon}>
                  <Ionicons
                    name={item.type === "exercise" ? "leaf-outline" : "book-outline"}
                    size={20}
                    color={colors.primary}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={typography.caption}>{meta}</Text>
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
          );
        })
      ) : (
        <Card>
          <Text style={[typography.body, styles.muted]}>
            No resources yet. Check back soon.
          </Text>
        </Card>
      )}
    </Screen>
  );
}

// Spinner while a card first loads, its own error + Try Again, else the content
function CardBody({
  state,
  label,
  children,
}: {
  state: CardState<unknown> & { load: () => void };
  label: string;
  children?: ReactNode;
}) {
  if (state.loading) {
    return (
      <ActivityIndicator
        color={colors.primary}
        style={styles.cardSpinner}
        accessibilityLabel={`Loading ${label}`}
      />
    );
  }
  if (state.error) {
    return (
      <View style={styles.cardError}>
        <Text style={[typography.body, styles.muted]} accessibilityLiveRegion="polite">
          Couldn't load {label}. {state.error}
        </Text>
        <Button title="Try Again" variant="secondary" onPress={state.load} />
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  // Right padding keeps the greeting clear of the floating crisis help button
  greeting: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
    paddingRight: TOUCH_TARGET + spacing.sm,
  },
  muted: { color: colors.textSecondary },
  cardSubtitle: { marginTop: spacing.xs },
  cardSpinner: { marginVertical: spacing.lg },
  cardError: { gap: spacing.md, marginTop: spacing.sm },
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
  todayMood: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  todayEmoji: { fontSize: 36 },
  pressed: { opacity: 0.7 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  week: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs, // Header row's 48px link already adds space
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
  todayLabel: { fontWeight: "700", color: colors.text },
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
  reminderLink: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: spacing.xs,
    minHeight: TOUCH_TARGET,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
  },
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
