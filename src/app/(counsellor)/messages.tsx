// Counsellor Messages - Muaath (Member 4). Supports FR07, NFR01, NFR02.
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, typography, TOUCH_TARGET } from "@/theme";
import { router } from "expo-router";

// Mocking the imports to ensure the file compiles without issues if types are missing
// import { MOCK_CHAT_THREADS, MOCK_CHAT_BUBBLES } from "@/services/mockMessagesData";
// import { ChatThread, ChatBubble, MessageFilter } from "@/types/counsellorMessages";

type MessageFilter = "all" | "unread" | "urgent" | "anon" | "archived";

const MOCK_CHAT_THREADS = [
  {
    id: "1",
    name: "Maya Lin",
    studentId: "6291",
    isAnonymous: false,
    avatar: "https://i.pravatar.cc/150?u=maya",
    status: "online",
    tag: "Weekly Check-in · In-Person",
    unreadCount: 2,
    time: "10:42 AM",
    lastMessage: "I've been feeling a bit overwhelmed lately...",
    isUrgent: false,
  },
  {
    id: "2",
    name: "Student #5104",
    studentId: "5104",
    isAnonymous: true,
    avatar: null,
    status: "online",
    tag: "URGENT TRIAGE · PHQ-9: 14",
    unreadCount: 1,
    time: "09:15 AM",
    lastMessage: "Can someone please talk to me right now",
    isUrgent: true,
  },
  {
    id: "3",
    name: "Sarah Jenkins",
    studentId: "8922",
    isAnonymous: false,
    avatar: "https://i.pravatar.cc/150?u=sarah",
    status: "offline",
    tag: "Weekly Consultation",
    unreadCount: 0,
    time: "Yesterday",
    lastMessage: "Thank you for the session today.",
    isUrgent: false,
  },
  {
    id: "4",
    name: "Student #8821",
    studentId: "8821",
    isAnonymous: true,
    avatar: null,
    status: "online",
    tag: "Crisis Follow-up",
    unreadCount: 0,
    time: "Oct 14",
    lastMessage: "The coping strategies are helping a bit.",
    isUrgent: false,
  },
  {
    id: "5",
    name: "Alex Rivera",
    studentId: "3321",
    isAnonymous: false,
    avatar: "https://i.pravatar.cc/150?u=alex",
    status: "offline",
    tag: "Bi-weekly Ongoing",
    unreadCount: 0,
    time: "Oct 11",
    lastMessage: "See you next week.",
    isUrgent: false,
  },
];

const MOCK_CHAT_BUBBLES = [
  {
    id: "1",
    sender: "counsellor",
    text: "Hi Maya, how have you been feeling since our last session?",
    time: "10:30 AM",
  },
  {
    id: "2",
    sender: "student",
    text: "I've been feeling a bit overwhelmed lately with midterms coming up.",
    time: "10:32 AM",
  },
  {
    id: "3",
    type: "system",
    label: "Prescribed Coping Module",
    title: "Anxiety Reduction Techniques",
    subtitle: "Completed on Oct 12",
  },
  {
    id: "4",
    sender: "counsellor",
    text: "I understand. That's completely normal. Have you had a chance to try the techniques we discussed?",
    time: "10:35 AM",
  },
];

export default function MessagesScreen() {
  const [activeFilter, setActiveFilter] = useState<MessageFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [localMessages, setLocalMessages] = useState(MOCK_CHAT_BUBBLES);
  
  const handleSend = () => {
    if (!chatInput.trim()) return;
    setLocalMessages([
      ...localMessages,
      {
        id: Date.now().toString(),
        sender: "counsellor",
        text: chatInput,
        time: "Just now",
      },
    ]);
    setChatInput("");
  };

  const renderThreadListView = () => (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoCircle}>
            <Ionicons name="medical" size={24} color={colors.surface} />
          </View>
          <View>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Breathe Clinical</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>PORTAL</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>Dr. Anjali Perera · Lead Counselor</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Notifications">
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
          </Pressable>
          <Image source={{ uri: "https://i.pravatar.cc/150?u=dr" }} style={styles.headerAvatar} />
        </View>
      </View>

      {/* TITLE & COMPOSE */}
      <View style={styles.titleSection}>
        <View>
          <Text style={styles.pageTitle}>Messages</Text>
          <Text style={styles.pageSubtitle}>Breathe Sanctuary · Confidential Consultations (18 Active Students)</Text>
        </View>
        <Pressable style={styles.composeButton} accessibilityRole="button" accessibilityLabel="Compose new message">
          <Ionicons name="pencil" size={24} color={colors.surface} />
        </Pressable>
      </View>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search student name, ID, or clinical tags..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textSecondary}
        />
        <Ionicons name="options-outline" size={20} color={colors.textSecondary} style={styles.filterIcon} />
      </View>

      {/* FILTER CHIPS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        <Pressable 
          style={[styles.filterChip, activeFilter === "all" && styles.filterChipActive]}
          onPress={() => setActiveFilter("all")}
          accessibilityRole="button"
          accessibilityLabel="All messages"
        >
          <Text style={[styles.filterChipText, activeFilter === "all" && styles.filterChipTextActive]}>All</Text>
        </Pressable>
        
        <Pressable 
          style={[styles.filterChip, activeFilter === "unread" && styles.filterChipActive]}
          onPress={() => setActiveFilter("unread")}
          accessibilityRole="button"
          accessibilityLabel="Unread messages"
        >
          <Text style={[styles.filterChipText, activeFilter === "unread" && styles.filterChipTextActive]}>Unread (3)</Text>
          <View style={[styles.dot, { backgroundColor: colors.primary, marginLeft: 4 }]} />
        </Pressable>

        <Pressable 
          style={[styles.filterChip, activeFilter === "urgent" && styles.filterChipActive]}
          onPress={() => setActiveFilter("urgent")}
          accessibilityRole="button"
          accessibilityLabel="Urgent messages"
        >
          <Text style={[styles.filterChipText, activeFilter === "urgent" && styles.filterChipTextActive]}>Urgent / Triage</Text>
          <View style={[styles.dot, { backgroundColor: colors.danger, marginLeft: 4 }]} />
        </Pressable>

        <Pressable 
          style={[styles.filterChip, activeFilter === "anon" && styles.filterChipActive]}
          onPress={() => setActiveFilter("anon")}
          accessibilityRole="button"
          accessibilityLabel="Anonymous messages"
        >
          <Text style={[styles.filterChipText, activeFilter === "anon" && styles.filterChipTextActive]}>Anon...</Text>
        </Pressable>
        
        <Pressable 
          style={[styles.filterChip, activeFilter === "archived" && styles.filterChipActive]}
          onPress={() => setActiveFilter("archived")}
          accessibilityRole="button"
          accessibilityLabel="Archived messages"
        >
          <Text style={[styles.filterChipText, activeFilter === "archived" && styles.filterChipTextActive]}>Archived</Text>
        </Pressable>
      </ScrollView>

      {/* ENCRYPTION BANNER */}
      <View style={styles.encryptionBanner}>
        <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
        <Text style={styles.encryptionText}>HIPAA & FERPA Compliant · E2E Encrypted</Text>
        <Ionicons name="lock-closed" size={14} color={colors.primary} />
      </View>

      {/* THREAD CARDS */}
      <View style={styles.threadList}>
        {MOCK_CHAT_THREADS.map((thread) => (
          <Pressable 
            key={thread.id}
            style={styles.threadCard}
            onPress={() => setActiveChatId(thread.id)}
            accessibilityRole="button"
            accessibilityLabel={`Chat with ${thread.name}`}
          >
            {thread.unreadCount > 0 && (
              <View style={[styles.accentBar, { backgroundColor: thread.isUrgent ? colors.danger : colors.primary }]} />
            )}
            
            <View style={styles.threadContent}>
              <View style={styles.avatarContainer}>
                {thread.avatar ? (
                  <Image source={{ uri: thread.avatar }} style={styles.threadAvatar} />
                ) : (
                  <View style={[styles.textAvatar, thread.isUrgent && styles.textAvatarUrgent]}>
                    <Text style={[styles.textAvatarLabel, thread.isUrgent && styles.textAvatarLabelUrgent]}>
                      #{thread.studentId}
                    </Text>
                  </View>
                )}
                <View style={[
                  styles.onlineDot, 
                  { backgroundColor: thread.status === "online" ? (thread.isUrgent ? colors.danger : colors.primary) : colors.textSecondary }
                ]} />
              </View>

              <View style={styles.threadMain}>
                <View style={styles.threadHeaderRow}>
                  <Text style={styles.threadName}>{thread.name} {thread.isAnonymous ? "" : `(Student #${thread.studentId})`}</Text>
                  <Text style={styles.threadTime}>{thread.time}</Text>
                </View>
                <View style={[styles.tagContainer, thread.isUrgent && styles.tagContainerUrgent]}>
                  <Text style={[styles.tagText, thread.isUrgent && styles.tagTextUrgent]}>{thread.tag}</Text>
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>{thread.lastMessage}</Text>
              </View>

              <View style={styles.threadRight}>
                {thread.unreadCount > 0 ? (
                  <View style={[styles.unreadBadge, { backgroundColor: thread.isUrgent ? colors.danger : colors.primary }]}>
                    <Text style={styles.unreadBadgeText}>{thread.unreadCount}</Text>
                  </View>
                ) : (
                  <Ionicons name={thread.id === "5" ? "checkmark" : "checkmark-done"} size={16} color={colors.textSecondary} />
                )}
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      {/* OUTREACH CARD */}
      <View style={styles.outreachCard}>
        <Text style={styles.outreachTitle}>Urgent Student Outreach</Text>
        <Text style={styles.outreachDesc}>
          Initiate contact with students identified via triage or referral.
        </Text>
        <View style={styles.outreachButtons}>
          <Pressable style={styles.primaryButton} accessibilityRole="button" accessibilityLabel="New Student Message">
            <Text style={styles.primaryButtonText}>New Student Message</Text>
          </Pressable>
          <Pressable style={styles.outlineButton} accessibilityRole="button" accessibilityLabel="Student Lookup">
            <Text style={styles.outlineButtonText}>Student Lookup</Text>
          </Pressable>
        </View>
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderChatDetailView = () => {
    const activeThread = MOCK_CHAT_THREADS.find(t => t.id === activeChatId);

    return (
      <View style={styles.chatDetailContainer}>
        {/* STICKY HEADER */}
        <View style={styles.chatHeader}>
          <Pressable style={styles.backButton} onPress={() => setActiveChatId(null)} accessibilityRole="button" accessibilityLabel="Back to messages">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.chatHeaderCenter}>
            <Text style={styles.chatHeaderTitle}>{activeThread?.name}</Text>
            <Text style={styles.chatHeaderSubtitle}>{activeThread?.tag}</Text>
          </View>
          <View style={styles.chatHeaderRight}>
            <Pressable style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Case notes">
              <Ionicons name="document-text-outline" size={24} color={colors.text} />
            </Pressable>
            <Pressable style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Schedule">
              <Ionicons name="calendar-outline" size={24} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* CONSULTATION BANNER */}
        <View style={styles.consultBanner}>
          <Ionicons name="time-outline" size={20} color={colors.danger} />
          <Text style={styles.consultText}>Next consultation: Tomorrow, 2:00 PM</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="View File">
            <Text style={styles.consultLink}>View File</Text>
          </Pressable>
        </View>

        {/* CHAT MESSAGES */}
        <ScrollView style={styles.chatMessages} contentContainerStyle={{ padding: spacing.md }}>
          {localMessages.map((msg: any) => {
            if (msg.type === "system") {
              return (
                <View key={msg.id} style={styles.systemCard}>
                  <Text style={styles.systemLabel}>{msg.label}</Text>
                  <Text style={styles.systemTitle}>{msg.title}</Text>
                  <Text style={styles.systemSubtitle}>{msg.subtitle}</Text>
                </View>
              );
            }
            
            const isCounsellor = msg.sender === "counsellor";
            
            return (
              <View key={msg.id} style={[styles.bubbleWrapper, isCounsellor ? styles.bubbleWrapperRight : styles.bubbleWrapperLeft]}>
                {!isCounsellor && (
                  <Image source={{ uri: activeThread?.avatar || "https://i.pravatar.cc/150?u=fallback" }} style={styles.bubbleAvatar} />
                )}
                <View style={[styles.bubble, isCounsellor ? styles.bubbleCounsellor : styles.bubbleStudent]}>
                  <Text style={[styles.bubbleText, isCounsellor ? styles.bubbleTextCounsellor : styles.bubbleTextStudent]}>{msg.text}</Text>
                  <Text style={[styles.bubbleTime, isCounsellor ? styles.bubbleTimeCounsellor : styles.bubbleTimeStudent]}>{msg.time}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* INPUT BAR */}
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.inputBar}>
            <Pressable style={styles.attachButton} accessibilityRole="button" accessibilityLabel="Attach file">
              <Ionicons name="add" size={28} color={colors.textSecondary} />
            </Pressable>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Type a message..."
                placeholderTextColor={colors.textSecondary}
                value={chatInput}
                onChangeText={setChatInput}
                multiline
              />
              <Pressable style={styles.quickPhrasesButton} accessibilityRole="button" accessibilityLabel="Quick phrases">
                <Ionicons name="flash-outline" size={20} color={colors.primary} />
              </Pressable>
            </View>
            <Pressable 
              style={[styles.sendButton, !chatInput.trim() && { opacity: 0.5 }]} 
              onPress={handleSend}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <Ionicons name="send" size={20} color={colors.surface} style={{ marginLeft: 2 }} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {activeChatId ? renderChatDetailView() : renderThreadListView()}
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
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  titleSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: colors.text,
  },
  pageSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  composeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    height: 48,
    marginBottom: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  filterIcon: {
    marginLeft: spacing.sm,
  },
  filterScroll: {
    flexGrow: 0,
    marginBottom: spacing.md,
  },
  filterContent: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.success,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: colors.primary,
    fontWeight: "bold",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  encryptionBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  encryptionText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "bold",
  },
  threadList: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  threadCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  accentBar: {
    width: 4,
  },
  threadContent: {
    flex: 1,
    flexDirection: "row",
    padding: spacing.md,
    gap: spacing.md,
  },
  avatarContainer: {
    position: "relative",
  },
  threadAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  textAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  textAvatarUrgent: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: colors.danger,
  },
  textAvatarLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.textSecondary,
  },
  textAvatarLabelUrgent: {
    color: colors.danger,
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.surface,
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  threadMain: {
    flex: 1,
  },
  threadHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  threadName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  threadTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  tagContainer: {
    alignSelf: "flex-start",
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  tagContainerUrgent: {
    backgroundColor: "#FFFBEB",
  },
  tagText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  tagTextUrgent: {
    color: colors.danger,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  threadRight: {
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  unreadBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.surface,
  },
  outreachCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outreachTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  outreachDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  outreachButtons: {
    flexDirection: "row",
    gap: spacing.md,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.surface,
  },
  outlineButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
    height: 48,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  outlineButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primary,
  },

  /* CHAT DETAIL STYLES */
  chatDetailContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  chatHeaderCenter: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  chatHeaderSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  chatHeaderRight: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  consultBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  consultText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: colors.danger,
  },
  consultLink: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primary,
    textDecorationLine: "underline",
  },
  chatMessages: {
    flex: 1,
  },
  systemCard: {
    backgroundColor: colors.success,
    padding: spacing.md,
    borderRadius: radius.md,
    alignSelf: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    maxWidth: "80%",
  },
  systemLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 4,
  },
  systemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  systemSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bubbleWrapper: {
    flexDirection: "row",
    marginBottom: spacing.md,
    alignItems: "flex-end",
  },
  bubbleWrapperLeft: {
    justifyContent: "flex-start",
  },
  bubbleWrapperRight: {
    justifyContent: "flex-end",
  },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: spacing.sm,
  },
  bubble: {
    maxWidth: "75%",
    padding: spacing.md,
    borderRadius: radius.md,
  },
  bubbleCounsellor: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleStudent: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
  },
  bubbleTextCounsellor: {
    color: colors.surface,
  },
  bubbleTextStudent: {
    color: colors.text,
  },
  bubbleTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  bubbleTimeCounsellor: {
    color: "rgba(255,255,255,0.7)",
  },
  bubbleTimeStudent: {
    color: colors.textSecondary,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: Platform.OS === "ios" ? 32 : spacing.md,
  },
  attachButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    minHeight: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    maxHeight: 100,
    paddingVertical: 10,
  },
  quickPhrasesButton: {
    padding: spacing.xs,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});
