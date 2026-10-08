import { FLOATING_HELP_CLEARANCE } from "@/components/crisis/UrgentHelpLink";
import NotificationItem from "@/components/notifications/NotificationItem";
import { colors, spacing } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import {
  timeAgo,
  updateMessage,
  updateTitle,
  useBookingUpdates,
} from "@/hooks/useBookingUpdates";
import { getTodayCheckin } from "@/services/checkinService";
import { listPublishedResources } from "@/services/resourceService";

type Notification = {
  id: string;
  title: string;
  body: string;
  time: string;
  type: "session" | "checkin" | "resource";
  read: boolean;
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const bookingUpdates = useBookingUpdates(user?.uid);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const [todayCheckin, resources] = await Promise.all([
          getTodayCheckin(user.uid),
          listPublishedResources(),
        ]);

        const notifs: Notification[] = [];
        let idCount = 1;

        if (!todayCheckin) {
          notifs.push({
            id: `n${idCount++}`,
            title: "Time to Check-In",
            body: "Don't forget to log your daily mood check-in for today!",
            time: "2 hours ago",
            type: "checkin",
            read: false,
          });
        }

        if (resources && resources.length > 0) {
          notifs.push({
            id: `n${idCount++}`,
            title: "New Breathing Exercise",
            body: `We recommended a new resource based on your recent check-in: "${resources[0].title}".`,
            time: "Yesterday",
            type: "resource",
            read: true,
          });
        }

        setNotifications(notifs);
      } catch (e) {
        console.warn("Failed to load notifications", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  useEffect(() => {
    if (!bookingUpdates.loading) bookingUpdates.markSeen();
  }, [bookingUpdates.loading, bookingUpdates.markSeen]);

  const upcomingBooking = bookingUpdates.upcomingBooking;
  const daysUntilUpcoming = upcomingBooking
    ? Math.floor((upcomingBooking.startAt.getTime() - Date.now()) / 86_400_000)
    : 0;
  const upcomingNotification: Notification | null = upcomingBooking
    ? {
        id: `upcoming-${upcomingBooking.id}`,
        title: "Upcoming Session Reminder",
        body: `Your ${upcomingBooking.sessionType} consultation with ${upcomingBooking.counsellorName} starts ${
          daysUntilUpcoming > 0 ? `in ${daysUntilUpcoming} days` : "soon"
        }.`,
        time: "Just now",
        type: "session",
        read: true,
      }
    : null;

  const allNotifications = [
    ...bookingUpdates.updates.map((update): Notification => ({
      id: `booking-${update.id}`,
      title: updateTitle(update),
      body: updateMessage(update),
      time: timeAgo(update.updatedAt),
      type: "session",
      read: !bookingUpdates.isUnread(update),
    })),
    ...(upcomingNotification ? [upcomingNotification] : []),
    ...notifications,
  ];

  const renderItem = ({ item }: { item: Notification }) => {
    let iconName: keyof typeof Ionicons.glyphMap = "notifications";
    let iconColor = colors.primary;

    if (item.type === "session") {
      iconName = "videocam";
      iconColor = "#10B981";
    } else if (item.type === "checkin") {
      iconName = "happy";
      iconColor = "#F59E0B";
    } else if (item.type === "resource") {
      iconName = "leaf";
      iconColor = "#3B82F6";
    }

    return (
      <NotificationItem
        icon={iconName}
        iconColor={iconColor}
        title={item.title}
        body={item.body}
        time={item.time}
        unread={!item.read}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => { if (router.canGoBack()) { router.back(); } else { router.push("/(student)/home"); } }} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading || (Boolean(user) && bookingUpdates.loading) ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <>
          {bookingUpdates.error ? (
            <Text style={styles.errorText}>
              Session updates could not be loaded. Please try again later.
            </Text>
          ) : null}
          <FlatList
            data={allNotifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={styles.emptyText}>You have no new notifications.</Text>}
          />
        </>
      )}
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  listContent: {
    padding: spacing.md,
  },
  emptyText: {
    textAlign: "center",
    color: colors.textSecondary,
    marginTop: 40,
    fontSize: 15,
  },
  errorText: {
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    textAlign: "center",
  },
});
