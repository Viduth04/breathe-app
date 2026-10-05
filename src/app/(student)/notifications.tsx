import { colors, radius, spacing } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { getUpcomingBooking } from "@/services/homeService";
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const [upcoming, todayCheckin, resources] = await Promise.all([
          getUpcomingBooking(user.uid),
          getTodayCheckin(user.uid),
          listPublishedResources(),
        ]);

        const notifs: Notification[] = [];
        let idCount = 1;

        if (upcoming) {
          const diffMs = upcoming.startAt.getTime() - Date.now();
          const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
          const diffMins = Math.floor(diffMs / (1000 * 60));

          let timeStr = "";
          if (diffHrs >= 24) timeStr = `in ${Math.floor(diffHrs / 24)} days`;
          else if (diffHrs > 0) timeStr = `in ${diffHrs} hours`;
          else if (diffMins > 0) timeStr = `in ${diffMins} minutes`;
          else timeStr = "starting now";

          notifs.push({
            id: `n${idCount++}`,
            title: "Upcoming Session Reminder",
            body: `Your ${upcoming.sessionType} consultation with ${upcoming.counsellorName} starts ${timeStr}.`,
            time: "Just now",
            type: "session",
            read: false,
          });
        }

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
      <View style={[styles.notificationCard, !item.read && styles.unreadCard]}>
        <View style={[styles.iconBox, { backgroundColor: iconColor + "20" }]}>
          <Ionicons name={iconName} size={24} color={iconColor} />
        </View>
        <View style={styles.textContent}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </View>
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

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>You have no new notifications.</Text>}
        />
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
  notificationCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "flex-start",
  },
  unreadCard: {
    backgroundColor: colors.white,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
  },
  emptyText: {
    textAlign: "center",
    color: colors.textSecondary,
    marginTop: 40,
    fontSize: 15,
  },
});
