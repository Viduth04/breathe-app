// Counsellor Messages - Muaath (Member 4). Supports FR07, NFR01, NFR02.
// Real-time confidential counseling inbox syncing directly with Firestore "chats" and "chats/{chatId}/messages".
// All mock data, demo toggles, and unwanted cards removed.

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { useCounsellorBadges } from "@/context/CounsellorBadgeContext";
import { useCounsellorStore } from "@/services/counsellorStore";
import { useAuth } from "@/context/AuthContext";
import {
  ChatThread,
  MessageFilter,
  MessageDelivery,
  ChatThreadStatus,
} from "@/types/counsellorMessages";
import CounsellorChatWrapper from "@/components/chat/CounsellorChatWrapper";
import { getOrCreateChat } from "@/services/chatService";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/config";

export default function CounsellorMessagesScreen() {
  const { decrementMessages } = useCounsellorBadges();
  const { profile, patients } = useCounsellorStore();
  const { user } = useAuth();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ studentAnonId?: string; fromAcceptance?: string }>();

  const [activeFilter, setActiveFilter] = useState<MessageFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [newChatModalVisible, setNewChatModalVisible] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState("");

  // Hide tab bar when deep inside a chat conversation
  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: activeChatId
        ? { display: "none" }
        : { backgroundColor: colors.surface, borderTopColor: colors.border },
    });
  }, [activeChatId, navigation]);

  // Synchronize real threads directly from Firestore "chats" collection
  useEffect(() => {
    if (!user?.uid) return;

    const chatsQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid)
    );

    const unsub = onSnapshot(
      chatsQuery,
      (snap) => {
        const realThreads: ChatThread[] = snap.docs.map((docSnap) => {
          const data = docSnap.data();
          const otherParticipantId =
            data.participants?.find((p: string) => p !== user.uid) || "Unknown";

          // Match student with real caseload patients
          const patient = patients.find(
            (p) =>
              p.studentId === otherParticipantId ||
              p.studentAnonId.toLowerCase().includes(otherParticipantId.toLowerCase())
          );

          const studentAnonId =
            data.studentAnonId ||
            patient?.studentAnonId ||
            `Student #${otherParticipantId.substring(0, 5).toUpperCase()}`;

          const displayName =
            data.displayName ||
            patient?.displayName ||
            studentAnonId;

          let timeStr = "Now";
          let sortTime = 0;
          if (data.updatedAt) {
            const date =
              typeof data.updatedAt.toDate === "function"
                ? data.updatedAt.toDate()
                : new Date(data.updatedAt);
            sortTime = date.getTime();
            const now = new Date();
            const isToday = now.toDateString() === date.toDateString();
            timeStr = isToday
              ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })
              : date.toLocaleDateString([], { month: "short", day: "numeric" });
          }

          const hasUnread = Boolean(data.unreadCount && data.unreadCount > 0);
          const isUrgent = Boolean(
            data.triageLevel === "urgent" ||
              data.priority === "urgent" ||
              patient?.badgeStyle === "amber"
          );

          const sessionTag =
            data.sessionTag ||
            (isUrgent ? "Urgent / Triage" : "Confidential Consultation");

          return {
            id: docSnap.id,
            studentId: otherParticipantId,
            studentAnonId,
            displayName,
            idMode: "anonymous",
            avatarUrl: data.avatarUrl || patient?.initials ? undefined : undefined,
            isOnline: Boolean(data.isOnline),
            lastMessage: data.lastMessage || "Encrypted consultation initiated",
            lastMessageTime: timeStr,
            unreadCount: data.unreadCount || (hasUnread ? 1 : 0),
            deliveryStatus: (data.deliveryStatus || "read") as MessageDelivery,
            sessionTag,
            triageLevel: isUrgent ? "urgent" : "normal",
            status: (data.status || "active") as ChatThreadStatus,
            _sortTime: sortTime,
          } as ChatThread & { _sortTime: number };
        });

        realThreads.sort((a, b) => (b as any)._sortTime - (a as any)._sortTime);
        setThreads(realThreads);
      },
      (err) => {
        console.warn("[messages] Firestore chats subscription notice:", err?.message || err);
      }
    );

    return () => unsub();
  }, [user?.uid, patients]);

  // Deep-link handling (e.g. from Alerts screen "Secure Chat" or Request Accepted)
  useEffect(() => {
    if (params?.studentAnonId) {
      if (params.fromAcceptance === "true") {
        router.navigate({
          pathname: "/(counsellor-detail)/pre-chat-empty-state",
          params: { studentAnonId: params.studentAnonId },
        });
        return;
      }

      const match = threads.find(
        (t) =>
          t.studentAnonId.toLowerCase() === params.studentAnonId?.toLowerCase() ||
          t.displayName.toLowerCase().includes(params.studentAnonId?.toLowerCase() || "")
      );
      if (match) {
        handleOpenThread(match);
      }
    }
  }, [params?.studentAnonId, params?.fromAcceptance, threads]);

  const handleOpenThread = (thread: ChatThread) => {
    setActiveChatId(thread.id);
    if (thread.unreadCount > 0) {
      setThreads((prev) =>
        prev.map((t) => (t.id === thread.id ? { ...t, unreadCount: 0 } : t))
      );
      decrementMessages();
    }
  };

  const handleStartChatWithStudent = async (studentId: string, studentAnonId: string) => {
    if (!user?.uid) return;
    setNewChatModalVisible(false);
    try {
      const chatId = await getOrCreateChat(studentId, user.uid);
      setActiveChatId(chatId);
    } catch (err: any) {
      console.warn("[messages] getOrCreateChat error:", err);
    }
  };

  // Filter threads based on search query and active filter chip
  const filteredThreads = threads.filter((thread) => {
    const matchesSearch =
      thread.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.studentAnonId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.sessionTag.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === "unread") return thread.unreadCount > 0;
    if (activeFilter === "urgent") return thread.triageLevel === "urgent";
    if (activeFilter === "anonymous") return thread.idMode === "anonymous";
    if (activeFilter === "archived") return thread.status === "archived";
    return true;
  });

  const unreadCountTotal = threads.filter((t) => t.unreadCount > 0).length;

  const activeThread = activeChatId
    ? threads.find((t) => t.id === activeChatId) || {
        id: activeChatId,
        studentId: "student",
        studentAnonId: "Anonymous Student",
        displayName: "Anonymous Student",
        idMode: "anonymous" as const,
        isOnline: false,
        lastMessage: "",
        lastMessageTime: "Just now",
        unreadCount: 0,
        deliveryStatus: "read" as const,
        sessionTag: "Confidential Consultation",
        triageLevel: "normal" as const,
        status: "active" as const,
      }
    : null;

  // Filter caseload patients for Compose Modal
  const availablePatients = patients.filter((p) => {
    if (!newChatSearch.trim()) return true;
    return (
      p.displayName.toLowerCase().includes(newChatSearch.toLowerCase()) ||
      p.studentAnonId.toLowerCase().includes(newChatSearch.toLowerCase())
    );
  });

  // ==========================================
  // THREAD LIST VIEW (MAIN INBOX)
  // ==========================================
  const renderThreadListView = () => (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. CLINICAL PORTAL HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.emblemCircle}>
            <Ionicons name="leaf-outline" size={20} color={colors.primary} />
          </View>
          <View>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Breathe Clinical</Text>
              <View style={styles.portalBadge}>
                <Text style={styles.portalBadgeText}>PORTAL</Text>
              </View>
            </View>
            <View style={styles.counselorSubRow}>
              <View style={styles.onDutyDot} />
              <Text style={styles.headerSubtitle}>
                {profile.fullName || "Dr. Anjali Perera"} · {profile.title || "Lead Counselor"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            style={styles.headerIconBtn}
            onPress={() => router.navigate("/(counsellor)/alerts")}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
          </Pressable>

          <Pressable
            style={styles.headerAvatarContainer}
            onPress={() => router.navigate("/(counsellor-detail)/settings")}
            accessibilityRole="button"
            accessibilityLabel="Counselor Profile Settings"
          >
            {profile?.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={styles.headerAvatar}
                accessibilityLabel="Counselor Profile Photo"
              />
            ) : (
              <View style={styles.headerAvatarFallback}>
                <Ionicons name="person" size={18} color="#065F46" />
              </View>
            )}
            <View style={styles.headerAvatarOnlineBadge} />
          </Pressable>
        </View>
      </View>

      {/* 2. TITLE & COMPOSE BUTTON */}
      <View style={styles.titleSection}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle} accessibilityRole="header">
            Messages
          </Text>
          <Text style={styles.pageSubtitle}>
            SLIIT Wellness Center · Confidential Consultations (
            {threads.length} Active {threads.length === 1 ? "Student" : "Students"})
          </Text>
        </View>

        <Pressable
          style={styles.composeButton}
          onPress={() => setNewChatModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Compose new message"
        >
          <Ionicons name="create-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {/* 3. SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={18}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search student ID, name, or clinical tag..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textSecondary}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* 4. FILTER CHIPS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        <Pressable
          style={[styles.filterChip, activeFilter === "all" && styles.filterChipActive]}
          onPress={() => setActiveFilter("all")}
          accessibilityRole="button"
          accessibilityLabel="All messages"
        >
          <Text
            style={[styles.filterChipText, activeFilter === "all" && styles.filterChipTextActive]}
          >
            All
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, activeFilter === "unread" && styles.filterChipActive]}
          onPress={() => setActiveFilter("unread")}
          accessibilityRole="button"
          accessibilityLabel="Unread messages"
        >
          <Text
            style={[
              styles.filterChipText,
              activeFilter === "unread" && styles.filterChipTextActive,
            ]}
          >
            Unread {unreadCountTotal > 0 ? `(${unreadCountTotal})` : ""}
          </Text>
          {unreadCountTotal > 0 && (
            <View style={[styles.filterDot, { backgroundColor: "#10B981" }]} />
          )}
        </Pressable>

        <Pressable
          style={[styles.filterChip, activeFilter === "urgent" && styles.filterChipActive]}
          onPress={() => setActiveFilter("urgent")}
          accessibilityRole="button"
          accessibilityLabel="Urgent messages"
        >
          <View style={[styles.filterDot, { backgroundColor: "#F59E0B" }]} />
          <Text
            style={[
              styles.filterChipText,
              activeFilter === "urgent" && styles.filterChipTextActive,
            ]}
          >
            Urgent / Triage
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, activeFilter === "anonymous" && styles.filterChipActive]}
          onPress={() => setActiveFilter("anonymous")}
          accessibilityRole="button"
          accessibilityLabel="Anonymous students"
        >
          <Text
            style={[
              styles.filterChipText,
              activeFilter === "anonymous" && styles.filterChipTextActive,
            ]}
          >
            Anonymous Students
          </Text>
        </Pressable>
      </ScrollView>

      {/* 5. ENCRYPTED CLINICAL CHANNEL BANNER */}
      <View style={styles.encryptionBanner} accessibilityRole="summary">
        <View style={styles.shieldIconBox}>
          <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.encryptionTitle}>
            HIPAA & FERPA Compliant · Access-Controlled & Encrypted
          </Text>
          <Text style={styles.encryptionSubtitle}>
            Authorized Clinical Record Storage & Audit Logs Active
          </Text>
        </View>
        <Ionicons name="lock-closed" size={16} color={colors.primary} />
      </View>

      {/* 6. CONVERSATION THREAD CARDS OR EMPTY STATE */}
      <View style={styles.threadList}>
        {filteredThreads.length === 0 ? (
          <View style={styles.emptyStateBox} accessibilityRole="summary">
            <View style={styles.emptyIconCircle}>
              <Ionicons name="chatbubbles-outline" size={36} color="#065F46" />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? "No matching conversations" : "No Active Conversations"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? `No student messages match "${searchQuery}".`
                : "When students book a consultation or send a message, their confidential chat thread will appear here."}
            </Text>

            {patients.length > 0 && !searchQuery && (
              <Pressable
                style={styles.emptyActionBtn}
                onPress={() => setNewChatModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Start New Message"
              >
                <Ionicons name="create-outline" size={16} color={colors.white} />
                <Text style={styles.emptyActionBtnText}>Start New Message</Text>
              </Pressable>
            )}
          </View>
        ) : (
          filteredThreads.map((thread) => {
            const isUrgent = thread.triageLevel === "urgent";
            const hasUnread = thread.unreadCount > 0;
            const numericId = thread.studentAnonId.replace(/[^0-9]/g, "") || thread.studentAnonId.slice(-4);

            return (
              <Pressable
                key={thread.id}
                style={[
                  styles.threadCard,
                  hasUnread && !isUrgent && styles.threadCardUnreadGreen,
                  isUrgent && styles.threadCardUnreadAmber,
                ]}
                onPress={() => handleOpenThread(thread)}
                accessibilityRole="button"
                accessibilityLabel={`Conversation with ${thread.displayName}, ${thread.lastMessageTime}`}
              >
                {/* Left Color Accent Bar */}
                {hasUnread && (
                  <View
                    style={[
                      styles.accentBar,
                      { backgroundColor: isUrgent ? "#F59E0B" : colors.primary },
                    ]}
                  />
                )}

                <View style={styles.threadContent}>
                  {/* Avatar Column with Clean Institutional Shield / Initials */}
                  <View style={styles.avatarContainer}>
                    <View
                      style={[
                        styles.anonAvatarCircle,
                        isUrgent && styles.anonAvatarCircleAmber,
                      ]}
                    >
                      <Ionicons
                        name="shield-outline"
                        size={14}
                        color={isUrgent ? "#D97706" : "#065F46"}
                        style={{ marginBottom: 1 }}
                      />
                      <Text
                        style={[
                          styles.anonAvatarText,
                          isUrgent && styles.anonAvatarTextAmber,
                        ]}
                      >
                        #{numericId}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.onlineBadgeDot,
                        {
                          backgroundColor: thread.isOnline
                            ? isUrgent
                              ? "#F59E0B"
                              : "#10B981"
                            : "#CBD5E1",
                        },
                      ]}
                    />
                  </View>

                  {/* Main Content Column */}
                  <View style={styles.threadMain}>
                    <View style={styles.threadHeaderRow}>
                      <Text style={styles.threadName} numberOfLines={1}>
                        {thread.displayName}
                      </Text>
                      <Text
                        style={[
                          styles.threadTime,
                          hasUnread && styles.threadTimeUnread,
                        ]}
                      >
                        {thread.lastMessageTime}
                      </Text>
                    </View>

                    {/* Modality Tag Chip (Only shown when sessionTag is non-empty) */}
                    {Boolean(thread.sessionTag) && (
                      <View style={[styles.tagChip, isUrgent && styles.tagChipUrgent]}>
                        <Text style={[styles.tagChipText, isUrgent && styles.tagChipTextUrgent]}>
                          {thread.sessionTag}
                        </Text>
                      </View>
                    )}

                    {/* Last Message Quote */}
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {thread.lastMessage}
                    </Text>
                  </View>

                  {/* Right Badge Column */}
                  <View style={styles.threadRight}>
                    {hasUnread ? (
                      <View
                        style={[
                          styles.unreadBadge,
                          { backgroundColor: isUrgent ? "#D97706" : colors.primary },
                        ]}
                      >
                        <Text style={styles.unreadBadgeText}>{thread.unreadCount}</Text>
                      </View>
                    ) : (
                      <Ionicons
                        name="checkmark-done"
                        size={17}
                        color={thread.deliveryStatus === "read" ? "#0D9488" : colors.textSecondary}
                      />
                    )}
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textSecondary}
                      style={{ marginTop: 4 }}
                    />
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </View>
    </ScrollView>
  );

  // ==========================================
  // INLINE CHAT DETAIL VIEW (REAL FIRESTORE)
  // ==========================================
  const renderChatDetailView = () => (
    <View style={styles.chatDetailContainer}>
      <CounsellorChatWrapper
        activeThread={activeThread}
        onBack={() => setActiveChatId(null)}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {activeChatId ? renderChatDetailView() : renderThreadListView()}

      {/* New Consultation Chat Modal */}
      <Modal
        visible={newChatModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNewChatModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.newChatSheet}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Start Consultation Chat</Text>
                <Text style={styles.sheetSubtitle}>
                  Select an assigned student to open an encrypted counseling thread.
                </Text>
              </View>
              <Pressable
                onPress={() => setNewChatModalVisible(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={22} color="#0F172A" />
              </Pressable>
            </View>

            <View style={styles.modalSearchBox}>
              <Ionicons name="search" size={16} color="#64748B" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Filter by Student ID or name..."
                placeholderTextColor="#94A3B8"
                value={newChatSearch}
                onChangeText={setNewChatSearch}
              />
            </View>

            <ScrollView style={styles.studentListScroll} showsVerticalScrollIndicator={false}>
              {availablePatients.length === 0 ? (
                <View style={styles.noStudentsBox}>
                  <Text style={styles.noStudentsText}>
                    {patients.length === 0
                      ? "No students registered in active caseload yet."
                      : "No students matching search filter."}
                  </Text>
                </View>
              ) : (
                availablePatients.map((patient) => (
                  <Pressable
                    key={patient.id}
                    style={styles.studentPickRow}
                    onPress={() =>
                      handleStartChatWithStudent(patient.studentId, patient.studentAnonId)
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Start chat with ${patient.studentAnonId}`}
                  >
                    <View style={styles.studentPickAvatar}>
                      <Ionicons name="shield-checkmark-outline" size={16} color="#065F46" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.studentPickName}>{patient.studentAnonId}</Text>
                      <Text style={styles.studentPickSub}>
                        {patient.sessionTimingText || "Active Caseload"}
                      </Text>
                    </View>
                    <Ionicons name="chatbubble-outline" size={18} color="#065F46" />
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  emblemCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
  },
  portalBadge: {
    backgroundColor: "#A7F3D0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  portalBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#064E3B",
  },
  counselorSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  onDutyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerIconBtn: {
    width: TOUCH_TARGET - 6,
    height: TOUCH_TARGET - 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarContainer: {
    position: "relative",
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  headerAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: "#ECFDF5",
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarOnlineBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: colors.white,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: spacing.sm,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  composeButton: {
    width: TOUCH_TARGET - 4,
    height: TOUCH_TARGET - 4,
    borderRadius: radius.full,
    backgroundColor: "#D1FAE5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: TOUCH_TARGET - 4,
    marginBottom: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  filterScroll: {
    marginBottom: spacing.sm + 2,
  },
  filterContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    minHeight: TOUCH_TARGET - 14,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.white,
    fontWeight: "700",
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  encryptionBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  shieldIconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  encryptionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  encryptionSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  threadList: {
    gap: spacing.sm + 2,
    marginBottom: spacing.lg,
  },
  emptyStateBox: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: "center",
    maxWidth: 280,
  },
  emptyActionBtn: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyActionBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.white,
  },
  threadCard: {
    position: "relative",
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  threadCardUnreadGreen: {
    borderColor: "rgba(6, 95, 70, 0.25)",
  },
  threadCardUnreadAmber: {
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  threadContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm + 4,
    paddingLeft: spacing.md,
  },
  avatarContainer: {
    position: "relative",
    marginRight: spacing.sm + 4,
  },
  anonAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
  },
  anonAvatarCircleAmber: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  anonAvatarText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#065F46",
  },
  anonAvatarTextAmber: {
    color: "#B45309",
  },
  onlineBadgeDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.white,
  },
  threadMain: {
    flex: 1,
  },
  threadHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  threadName: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    flex: 1,
    marginRight: spacing.xs,
  },
  threadTime: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  threadTimeUnread: {
    color: colors.primary,
    fontWeight: "700",
  },
  tagChip: {
    alignSelf: "flex-start",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginVertical: 3,
  },
  tagChipUrgent: {
    backgroundColor: "#FEF3C7",
  },
  tagChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },
  tagChipTextUrgent: {
    color: "#B45309",
  },
  lastMessage: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  threadRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    paddingLeft: spacing.sm,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.white,
  },
  chatDetailContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  newChatSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.md + 4,
    maxHeight: "75%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  sheetSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  modalSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
  },
  studentListScroll: {
    maxHeight: 280,
  },
  noStudentsBox: {
    paddingVertical: 24,
    alignItems: "center",
  },
  noStudentsText: {
    fontSize: 12.5,
    color: "#94A3B8",
  },
  studentPickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  studentPickAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    alignItems: "center",
    justifyContent: "center",
  },
  studentPickName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  studentPickSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
});
