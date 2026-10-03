// Counsellor Messages - Muaath (Member 4). Supports FR07, NFR01, NFR02.
// Secure, confidential, E2E encrypted chat inbox matching exact Figma design specifications.

import { useCounsellorBadges } from "@/context/CounsellorBadgeContext";
import {
  MOCK_CHAT_BUBBLES,
  MOCK_CHAT_THREADS,
} from "@/services/mockMessagesData";
import { colors, radius, spacing, TOUCH_TARGET, typography } from "@/theme";
import {
  ChatBubble,
  ChatThread,
  MessageFilter,
} from "@/types/counsellorMessages";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { useCounsellorStore } from "@/services/counsellorStore";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CounsellorMessagesScreen() {
  const { messagesUnread, decrementMessages } = useCounsellorBadges();
  const {
    threads: storeThreads,
    clearAllConversations,
    resetConversations,
  } = useCounsellorStore();

  const params = useLocalSearchParams<{ studentAnonId?: string; fromAcceptance?: string }>();
  const [activeFilter, setActiveFilter] = useState<MessageFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [threads, setThreads] = useState<ChatThread[]>(storeThreads);
  const [messages, setMessages] = useState<ChatBubble[]>(MOCK_CHAT_BUBBLES);

  // Sync threads whenever store updates
  useEffect(() => {
    setThreads(storeThreads);
  }, [storeThreads]);

  // Outreach Modal state (with Anonymous Student ID search bar)
  const [outreachModalVisible, setOutreachModalVisible] = useState(false);
  const [outreachSearchId, setOutreachSearchId] = useState("");
  const [outreachFeedback, setOutreachFeedback] = useState<string | null>(null);
  const [caseNotesModalVisible, setCaseNotesModalVisible] = useState(false);

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
          t.studentAnonId.toLowerCase() ===
            params.studentAnonId?.toLowerCase() ||
          t.displayName
            .toLowerCase()
            .includes(params.studentAnonId?.toLowerCase() || "")
      );
      if (match) {
        handleOpenThread(match);
      } else {
        // New thread without prior messages -> open pre-chat waiting room
        router.navigate({
          pathname: "/(counsellor-detail)/pre-chat-empty-state",
          params: { studentAnonId: params.studentAnonId },
        });
      }
    }
  }, [params?.studentAnonId, params?.fromAcceptance]);

  // Open a conversation thread
  const handleOpenThread = (thread: ChatThread) => {
    setActiveChatId(thread.id);
    if (thread.unreadCount > 0) {
      setThreads((prev) =>
        prev.map((t) => (t.id === thread.id ? { ...t, unreadCount: 0 } : t))
      );
      decrementMessages();
    }
  };

  // Send a new confidential message
  const handleSend = () => {
    if (!chatInput.trim()) return;
    const newBubble: ChatBubble = {
      id: `msg-${Date.now()}`,
      senderId: "counsellor-1",
      senderRole: "counsellor",
      text: chatInput.trim(),
      timestamp: "Just now",
      deliveryStatus: "delivered",
    };
    setMessages((prev) => [...prev, newBubble]);
    setChatInput("");
  };

  // Filter threads based on active filter chip and search query
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

  const activeThread =
    (activeChatId ? threads.find((t) => t.id === activeChatId) : null) ||
    threads[0] ||
    null;

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
                Dr. Anjali Perera · Lead Counselor
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Notification bell with navigate to Alerts */}
          <Pressable
            style={styles.headerIconBtn}
            onPress={() => router.navigate("/(counsellor)/alerts")}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.text}
            />
            <View style={styles.headerBellBadge} />
          </Pressable>

          <View style={styles.headerAvatarContainer}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1594824813645-316b2cfd2906?auto=format&fit=crop&w=256&q=80",
              }}
              style={styles.headerAvatar}
            />
            <View style={styles.headerAvatarOnlineBadge} />
          </View>
        </View>
      </View>

      {/* 2. TITLE & COMPOSE BUTTON */}
      <View style={styles.titleSection}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle} accessibilityRole="header">
            Messages
          </Text>
          <Text style={styles.pageSubtitle}>
            Breathe Sanctuary · Confidential Consultations (18 Active Students)
          </Text>
        </View>
        <View style={styles.titleActionsRow}>
          <Pressable
            style={[
              styles.demoTogglePill,
              threads.length === 0 && styles.demoTogglePillActive,
            ]}
            onPress={threads.length === 0 ? resetConversations : clearAllConversations}
            accessibilityRole="button"
            accessibilityLabel={threads.length === 0 ? "Restore sample conversations" : "Demo empty state"}
          >
            <Text
              style={[
                styles.demoTogglePillText,
                threads.length === 0 && styles.demoTogglePillTextActive,
              ]}
            >
              {threads.length === 0 ? "Restore" : "Demo Empty"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.composeButton}
            onPress={() => setOutreachModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Compose new confidential message"
          >
            <Ionicons
              name="create-outline"
              size={22}
              color={colors.primary}
            />
          </Pressable>
        </View>
      </View>

      {/* 3. SEARCH BAR WITH FILTER TUNE ICON */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={18}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search student name, ID, or clinical tags..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textSecondary}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filter search results"
          hitSlop={8}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>

      {/* 4. FILTER CHIPS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        <Pressable
          style={[
            styles.filterChip,
            activeFilter === "all" && styles.filterChipActive,
          ]}
          onPress={() => setActiveFilter("all")}
          accessibilityRole="button"
          accessibilityLabel="All messages"
        >
          <Text
            style={[
              styles.filterChipText,
              activeFilter === "all" && styles.filterChipTextActive,
            ]}
          >
            All
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.filterChip,
            activeFilter === "unread" && styles.filterChipActive,
          ]}
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
            Unread (3)
          </Text>
          <View style={[styles.filterDot, { backgroundColor: "#10B981" }]} />
        </Pressable>

        <Pressable
          style={[
            styles.filterChip,
            activeFilter === "urgent" && styles.filterChipActive,
          ]}
          onPress={() => setActiveFilter("urgent")}
          accessibilityRole="button"
          accessibilityLabel="Urgent and triage messages"
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
          style={[
            styles.filterChip,
            activeFilter === "anonymous" && styles.filterChipActive,
          ]}
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

        <Pressable
          style={[
            styles.filterChip,
            activeFilter === "archived" && styles.filterChipActive,
          ]}
          onPress={() => setActiveFilter("archived")}
          accessibilityRole="button"
          accessibilityLabel="Archived consultations"
        >
          <Text
            style={[
              styles.filterChipText,
              activeFilter === "archived" && styles.filterChipTextActive,
            ]}
          >
            Archived
          </Text>
        </Pressable>
      </ScrollView>

      {/* 5. ENCRYPTED CLINICAL CHANNEL BANNER */}
      <View style={styles.encryptionBanner} accessibilityRole="summary">
        <View style={styles.shieldIconBox}>
          <Ionicons
            name="shield-checkmark"
            size={18}
            color={colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.encryptionTitle}>
            HIPAA & FERPA Compliant · E2E Encrypted
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
          threads.length === 0 ? (
            <View style={styles.calmEmptyCard} accessibilityRole="summary">
              <View style={styles.calmRadarOuter}>
                <View style={styles.calmRadarMiddle}>
                  <View style={styles.calmRadarInner}>
                    <Ionicons
                      name="shield-checkmark"
                      size={28}
                      color={colors.primary}
                    />
                  </View>
                </View>
              </View>

              <Text style={styles.calmEmptyTitle}>Your Clinical Inbox is Clear</Text>
              <Text style={styles.calmEmptySub}>
                All conversations are confidential and end-to-end encrypted. When a session request is accepted or an urgent outreach is initiated, the secure consultation channel will appear here.
              </Text>

              <View style={styles.calmEmptyActionsCol}>
                <Pressable
                  style={styles.calmPrimaryBtn}
                  onPress={() => router.navigate("/(counsellor)/dashboard")}
                  accessibilityRole="button"
                  accessibilityLabel="View pending session requests on dashboard"
                >
                  <Ionicons name="calendar-outline" size={16} color={colors.white} />
                  <Text style={styles.calmPrimaryBtnText}>View Pending Requests</Text>
                </Pressable>

                <Pressable
                  style={styles.calmSecondaryBtn}
                  onPress={() => router.push("/(counsellor-detail)/pre-chat-empty-state")}
                  accessibilityRole="button"
                  accessibilityLabel="Open Student #4021 Waiting Room"
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary} />
                  <Text style={styles.calmSecondaryBtnText}>Open Student Waiting Room</Text>
                </Pressable>

                <Pressable
                  style={styles.calmRestoreBtn}
                  onPress={resetConversations}
                  accessibilityRole="button"
                  accessibilityLabel="Restore sample conversations"
                >
                  <Ionicons name="refresh-outline" size={15} color={colors.textSecondary} />
                  <Text style={styles.calmRestoreBtnText}>Restore Sample Conversations</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.emptyThreadsBox} accessibilityRole="summary">
              <View style={styles.emptyThreadsIconCircle}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={32}
                  color={colors.textSecondary}
                />
              </View>
              <Text style={styles.emptyThreadsTitle}>No matching conversations</Text>
              <Text style={styles.emptyThreadsSubtitle}>
                {searchQuery
                  ? `No students matching "${searchQuery}"`
                  : `No consultations currently under "${activeFilter}".`}
              </Text>
              {(searchQuery.length > 0 || activeFilter !== "all") && (
                <Pressable
                  style={styles.resetFilterBtn}
                  onPress={() => {
                    setSearchQuery("");
                    setActiveFilter("all");
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search and filter"
                >
                  <Text style={styles.resetFilterBtnText}>Reset Filter & Search</Text>
                </Pressable>
              )}
            </View>
          )
        ) : (
          filteredThreads.map((thread) => {
          const isUrgent = thread.triageLevel === "urgent";
          const hasUnread = thread.unreadCount > 0;

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
              accessibilityLabel={`Conversation with ${thread.displayName}, ${thread.lastMessageTime}. ${
                hasUnread ? `${thread.unreadCount} unread messages` : ""
              }`}
            >
              {/* Left Color Accent Bar */}
              {hasUnread && (
                <View
                  style={[
                    styles.accentBar,
                    {
                      backgroundColor: isUrgent ? "#F59E0B" : colors.primary,
                    },
                  ]}
                />
              )}

              <View style={styles.threadContent}>
                {/* Avatar Column */}
                <View style={styles.avatarContainer}>
                  {thread.avatarUrl ? (
                    <Image
                      source={{ uri: thread.avatarUrl }}
                      style={styles.threadAvatar}
                    />
                  ) : (
                    <View
                      style={[
                        styles.anonAvatarCircle,
                        isUrgent && styles.anonAvatarCircleAmber,
                      ]}
                    >
                      <Text
                        style={[
                          styles.anonAvatarText,
                          isUrgent && styles.anonAvatarTextAmber,
                        ]}
                      >
                        #{thread.studentId.replace("std-", "")}
                      </Text>
                    </View>
                  )}
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
                      {thread.displayName}{" "}
                      {thread.idMode === "standard" && (
                        <Text style={styles.threadAnonSub}>
                          ({thread.studentAnonId})
                        </Text>
                      )}
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

                  {/* Modality Tag Chip */}
                  <View
                    style={[
                      styles.tagChip,
                      isUrgent && styles.tagChipUrgent,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagChipText,
                        isUrgent && styles.tagChipTextUrgent,
                      ]}
                    >
                      {thread.sessionTag}
                    </Text>
                  </View>

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
                        {
                          backgroundColor: isUrgent
                            ? "#D97706"
                            : colors.primary,
                        },
                      ]}
                    >
                      <Text style={styles.unreadBadgeText}>
                        {thread.unreadCount}
                      </Text>
                    </View>
                  ) : (
                    <Ionicons
                      name={
                        thread.deliveryStatus === "read"
                          ? "checkmark-done"
                          : "checkmark"
                      }
                      size={18}
                      color={
                        thread.deliveryStatus === "read"
                          ? "#0D9488"
                          : colors.textSecondary
                      }
                    />
                  )}
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSecondary}
                    style={{ marginTop: 6 }}
                  />
                </View>
              </View>
            </Pressable>
          );
        })
      )}
      </View>

      {/* 7. URGENT STUDENT OUTREACH CARD */}
      <View style={styles.outreachCard} accessibilityRole="summary">
        <View style={styles.outreachHeaderRow}>
          <View style={styles.outreachIconBox}>
            <Ionicons
              name="newspaper-outline"
              size={20}
              color={colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.outreachTitle}>Urgent Student Outreach</Text>
            <Text style={styles.outreachDesc}>
              Need to initiate urgent outreach? Search student ID or schedule
              an intake consult.
            </Text>
          </View>
        </View>

        <View style={styles.outreachButtons}>
          <Pressable
            style={styles.primaryOutreachBtn}
            onPress={() => setOutreachModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="New Student Message"
          >
            <Ionicons name="send" size={16} color={colors.white} />
            <Text style={styles.primaryOutreachBtnText}>
              New Student Message
            </Text>
          </Pressable>
          <Pressable
            style={styles.outlineOutreachBtn}
            onPress={() => setOutreachModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Student Lookup"
          >
            <Ionicons
              name="people-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.outlineOutreachBtnText}>Student Lookup</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );

  // ==========================================
  // INLINE CHAT DETAIL VIEW
  // ==========================================
  const renderChatDetailView = () => (
    <View style={styles.chatDetailContainer}>
      {/* Sticky Top Header */}
      <View style={styles.chatHeader}>
        <Pressable
          style={styles.chatBackBtn}
          onPress={() => setActiveChatId(null)}
          accessibilityRole="button"
          accessibilityLabel="Back to messages inbox"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.chatHeaderCenter}>
          <Text style={styles.chatHeaderTitle} numberOfLines={1}>
            {activeThread?.displayName || "Student"}{" "}
            {activeThread?.idMode === "standard" && activeThread?.studentAnonId && (
              <Text style={{ fontSize: 13, fontWeight: "500" }}>
                ({activeThread.studentAnonId})
              </Text>
            )}
          </Text>
          <View style={styles.chatHeaderSubRow}>
            <View style={styles.chatHeaderStatusDot} />
            <Text style={styles.chatHeaderSubtitle}>
              Active Session · Encrypted
            </Text>
          </View>
        </View>

        <View style={styles.chatHeaderActions}>
          <Pressable
            style={styles.chatHeaderIconBtn}
            onPress={() => setCaseNotesModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Open Case Notes"
          >
            <Ionicons
              name="document-text-outline"
              size={22}
              color={colors.primary}
            />
          </Pressable>
          <Pressable
            style={styles.chatHeaderIconBtn}
            onPress={() => router.navigate("/(counsellor)/schedule")}
            accessibilityRole="button"
            accessibilityLabel="View Clinical Schedule"
          >
            <Ionicons
              name="calendar-outline"
              size={22}
              color={colors.primary}
            />
          </Pressable>
        </View>
      </View>

      {/* Next Consultation Reminder Banner */}
      <View style={styles.consultationBanner} accessibilityRole="summary">
        <Ionicons name="time" size={18} color="#D97706" />
        <Text style={styles.consultationText}>
          Next Consultation: Tomorrow, 2:00 PM (Counseling Suite 304B)
        </Text>
        <Pressable
          onPress={() => setCaseNotesModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="View File"
        >
          <Text style={styles.consultationLink}>View File</Text>
        </Pressable>
      </View>

      {/* Chat Messages Stream */}
      <ScrollView
        style={styles.chatStream}
        contentContainerStyle={styles.chatStreamContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((bubble) => {
          if (bubble.isSystemCard) {
            return (
              <View
                key={bubble.id}
                style={styles.systemModuleCard}
                accessibilityRole="summary"
              >
                <View style={styles.systemCardHeader}>
                  <Ionicons name="sparkles" size={16} color={colors.primary} />
                  <Text style={styles.systemCardLabel}>
                    Prescribed Coping Module
                  </Text>
                  <View style={styles.ehrBadge}>
                    <Text style={styles.ehrBadgeText}>Auto-logged to EHR</Text>
                  </View>
                </View>
                <Text style={styles.systemCardTitle}>
                  {bubble.systemCardTitle}
                </Text>
                <Text style={styles.systemCardSubtitle}>
                  {bubble.systemCardSubtitle}
                </Text>
              </View>
            );
          }

          const isCounsellor = bubble.senderRole === "counsellor";

          return (
            <View
              key={bubble.id}
              style={[
                styles.bubbleRow,
                isCounsellor ? styles.bubbleRowRight : styles.bubbleRowLeft,
              ]}
            >
              {!isCounsellor && (
                <View style={styles.studentBubbleAvatar}>
                  <Ionicons name="person" size={14} color={colors.textSecondary} />
                </View>
              )}

              <View
                style={[
                  styles.bubble,
                  isCounsellor ? styles.bubbleCounsellor : styles.bubbleStudent,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    isCounsellor
                      ? styles.bubbleTextCounsellor
                      : styles.bubbleTextStudent,
                  ]}
                >
                  {bubble.text}
                </Text>
                <View style={styles.bubbleMetaRow}>
                  <Text
                    style={[
                      styles.bubbleTime,
                      isCounsellor
                        ? styles.bubbleTimeCounsellor
                        : styles.bubbleTimeStudent,
                    ]}
                  >
                    {bubble.timestamp}
                    {isCounsellor ? " · Sent as Lead Counselor" : ""}
                  </Text>
                  {isCounsellor && (
                    <Ionicons
                      name="checkmark-done"
                      size={14}
                      color="#A7F3D0"
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Message Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputBar}>
          <Pressable
            style={styles.attachBtn}
            accessibilityRole="button"
            accessibilityLabel="Attach coping exercise or assessment"
            onPress={() => setCaseNotesModalVisible(true)}
          >
            <Ionicons name="add" size={26} color={colors.primary} />
          </Pressable>

          <View style={styles.textInputBox}>
            <TextInput
              style={styles.textInput}
              placeholder="Type confidential message..."
              placeholderTextColor={colors.textSecondary}
              value={chatInput}
              onChangeText={setChatInput}
              multiline
            />
            <Pressable
              style={styles.quickPhrasesBtn}
              onPress={() => setChatInput("Remember to take slow, 4-7-8 breaths.")}
              accessibilityRole="button"
              accessibilityLabel="Insert quick clinical phrases"
            >
              <Ionicons name="flash-outline" size={18} color={colors.primary} />
            </Pressable>
          </View>

          <Pressable
            style={[
              styles.sendBtn,
              !chatInput.trim() && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!chatInput.trim()}
            accessibilityRole="button"
            accessibilityLabel="Send confidential message"
          >
            <Ionicons name="arrow-up" size={20} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {activeChatId ? renderChatDetailView() : renderThreadListView()}

      {/* Outreach / Student Lookup Bottom Sheet Modal */}
      <Modal
        visible={outreachModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOutreachModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.outreachSheet} accessibilityViewIsModal={true}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} accessibilityRole="header">
                Student Outreach & Lookup
              </Text>
              <Pressable
                onPress={() => setOutreachModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close lookup sheet"
                hitSlop={8}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <Text style={styles.sheetSubtitle}>
              Initiate encrypted outreach or lookup confidential clinical file
              by Anonymous ID.
            </Text>

            {/* Anonymous Student ID Search Bar */}
            <View style={styles.sheetSearchBox}>
              <Ionicons
                name="search"
                size={18}
                color={colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <TextInput
                style={styles.sheetSearchInput}
                placeholder="Search by Anonymous ID, e.g. #5104 or #6291"
                placeholderTextColor={colors.textSecondary}
                value={outreachSearchId}
                onChangeText={setOutreachSearchId}
                autoCapitalize="none"
              />
            </View>

            {/* Quick Suggestions */}
            <Text style={styles.quickSuggestLabel}>Recent Priority Triage:</Text>
            <View style={styles.quickSuggestRow}>
              {["#5104", "#6291", "#8821", "#4021"].map((anonTag) => (
                <Pressable
                  key={anonTag}
                  style={styles.suggestPill}
                  onPress={() => setOutreachSearchId(anonTag)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select student ${anonTag}`}
                >
                  <Text style={styles.suggestPillText}>{anonTag}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.sheetActions}>
              <Pressable
                style={styles.sheetSubmitBtn}
                onPress={() => {
                  setOutreachFeedback(
                    `Found Student ${outreachSearchId || "#5104"}. E2E channel ready.`
                  );
                  setTimeout(() => {
                    setOutreachModalVisible(false);
                    setOutreachFeedback(null);
                    setActiveChatId("chat-2");
                  }, 1200);
                }}
                accessibilityRole="button"
                accessibilityLabel="Start Encrypted Chat"
              >
                <Text style={styles.sheetSubmitBtnText}>
                  {outreachFeedback || "Open Encrypted Outreach Channel"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Case Notes Modal */}
      <Modal
        visible={caseNotesModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCaseNotesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notesCard} accessibilityViewIsModal={true}>
            <Text style={styles.notesCardTitle} accessibilityRole="header">
              Clinical Case Notes
            </Text>
            <Text style={styles.notesCardSubtitle}>
              {activeThread
                ? `${activeThread.displayName} (${activeThread.studentAnonId})`
                : "Confidential Student Case"}
            </Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>
                • Ongoing Exam Anxiety & Midterm Stress Panic Management{"\n"}•
                PHQ-9 Intake score logged as Moderate{"\n"}• Box Breathing 4-4-4-4
                prescribed on Oct 12{"\n"}• Next video check-in scheduled for
                Thursday 2:00 PM
              </Text>
            </View>
            <Pressable
              style={styles.notesCloseBtn}
              onPress={() => setCaseNotesModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Close Case Notes"
            >
              <Text style={styles.notesCloseBtnText}>Close Notes</Text>
            </Pressable>
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
    position: "relative",
    width: TOUCH_TARGET - 6,
    height: TOUCH_TARGET - 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBellBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.white,
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
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  titleActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  demoTogglePill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  demoTogglePillActive: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  demoTogglePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  demoTogglePillTextActive: {
    color: "#DC2626",
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
  threadCard: {
    position: "relative",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
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
    borderColor: "rgba(7, 96, 71, 0.2)",
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
  threadAvatar: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  anonAvatarCircle: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  anonAvatarCircleAmber: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  anonAvatarText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.text,
  },
  anonAvatarTextAmber: {
    color: "#B45309",
  },
  onlineBadgeDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
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
  threadAnonSub: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textSecondary,
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
    fontStyle: "italic",
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
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.white,
  },
  outreachCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  outreachHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  outreachIconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.sm + 4,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  outreachTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  outreachDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  outreachButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  primaryOutreachBtn: {
    flex: 1,
    minHeight: TOUCH_TARGET - 6,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryOutreachBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
  },
  outlineOutreachBtn: {
    flex: 1,
    minHeight: TOUCH_TARGET - 6,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  outlineOutreachBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },

  // CHAT DETAIL STYLES
  chatDetailContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chatBackBtn: {
    width: TOUCH_TARGET - 4,
    height: TOUCH_TARGET - 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
  },
  chatHeaderCenter: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  chatHeaderTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  chatHeaderSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  chatHeaderStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  chatHeaderSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  chatHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chatHeaderIconBtn: {
    width: TOUCH_TARGET - 8,
    height: TOUCH_TARGET - 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    backgroundColor: "#ECFDF5",
  },
  consultationBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
    gap: spacing.xs + 2,
  },
  consultationText: {
    fontSize: 11,
    color: "#92400E",
    fontWeight: "600",
    flex: 1,
  },
  consultationLink: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  chatStream: {
    flex: 1,
  },
  chatStreamContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  systemModuleCard: {
    backgroundColor: "#ECFDF5",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  systemCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  systemCardLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
    flex: 1,
  },
  ehrBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  ehrBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#064E3B",
  },
  systemCardTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 2,
  },
  systemCardSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.xs + 2,
    maxWidth: "86%",
  },
  bubbleRowLeft: {
    alignSelf: "flex-start",
  },
  bubbleRowRight: {
    alignSelf: "flex-end",
  },
  studentBubbleAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    padding: spacing.md,
    borderRadius: radius.md,
  },
  bubbleCounsellor: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleStudent: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
  },
  bubbleTextCounsellor: {
    color: colors.white,
  },
  bubbleTextStudent: {
    color: colors.text,
  },
  bubbleMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 6,
  },
  bubbleTime: {
    fontSize: 10,
  },
  bubbleTimeCounsellor: {
    color: "rgba(255, 255, 255, 0.75)",
  },
  bubbleTimeStudent: {
    color: colors.textSecondary,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs + 2,
  },
  attachBtn: {
    width: TOUCH_TARGET - 6,
    height: TOUCH_TARGET - 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: "#ECFDF5",
  },
  textInputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: TOUCH_TARGET - 6,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    maxHeight: 80,
    paddingVertical: 6,
  },
  quickPhrasesBtn: {
    padding: 4,
  },
  sendBtn: {
    width: TOUCH_TARGET - 6,
    height: TOUCH_TARGET - 6,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },

  // MODAL OVERLAYS
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  outreachSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.md + 8,
    borderTopRightRadius: radius.md + 8,
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  sheetSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: TOUCH_TARGET,
    marginBottom: spacing.md,
  },
  sheetSearchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  quickSuggestLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  quickSuggestRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  suggestPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  sheetActions: {
    marginTop: spacing.xs,
  },
  sheetSubmitBtn: {
    minHeight: TOUCH_TARGET,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetSubmitBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  notesCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md + 4,
    padding: spacing.lg,
    margin: spacing.lg,
    alignSelf: "center",
    width: "90%",
    maxWidth: 400,
    elevation: 8,
  },
  notesCardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 2,
  },
  notesCardSubtitle: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  notesBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: radius.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  notesText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 20,
  },
  notesCloseBtn: {
    minHeight: TOUCH_TARGET - 6,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  notesCloseBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  emptyThreadsBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.md,
    gap: spacing.xs + 2,
  },
  emptyThreadsIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  emptyThreadsTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  emptyThreadsSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  resetFilterBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: "#ECFDF5",
    borderRadius: radius.full,
  },
  resetFilterBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  calmEmptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.md,
    shadowColor: "#076047",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  calmRadarOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#ECFDF5",
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  calmRadarMiddle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  calmRadarInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  calmEmptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  calmEmptySub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: spacing.lg,
    maxWidth: 320,
  },
  calmEmptyActionsCol: {
    width: "100%",
    gap: spacing.sm,
  },
  calmPrimaryBtn: {
    minHeight: TOUCH_TARGET,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
  },
  calmPrimaryBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  calmSecondaryBtn: {
    minHeight: TOUCH_TARGET,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
  },
  calmSecondaryBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  calmRestoreBtn: {
    minHeight: TOUCH_TARGET - 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    marginTop: 4,
  },
  calmRestoreBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
});
