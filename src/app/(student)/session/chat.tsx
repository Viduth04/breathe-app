import { colors, radius, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Chat</Text>
        <Image
          source={{ uri: "https://i.pravatar.cc/150?img=47" }}
          style={styles.headerAvatar}
        />
      </View>

      {/* Doctor Info Card */}
      <View style={styles.doctorInfoCard}>
        <View style={styles.doctorInfoLeft}>
          <View>
            <Image
              source={{ uri: "https://i.pravatar.cc/150?img=5" }}
              style={styles.doctorAvatar}
            />
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.doctorName}>Dr. Anjali Perera</Text>
            <View style={styles.statusRow}>
              <View style={styles.smallOnlineDot} />
              <Text style={styles.statusText}>Active now • ~5m reply</Text>
            </View>
          </View>
        </View>
        <View style={styles.licensedBadge}>
          <Text style={styles.licensedText}>Licensed</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Chat Feed */}
        <ScrollView style={styles.chatFeed} contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false}>
          
          {/* Date Separator */}
          <View style={styles.dateSeparator}>
            <View style={styles.datePill}>
              <Text style={styles.dateText}>Today, 10:15 AM</Text>
            </View>
          </View>

          {/* Received Message 1 */}
          <View style={styles.messageRowReceived}>
            <View style={styles.messageBubbleReceived}>
              <Text style={styles.messageTextReceived}>
                Hello! I saw you are interested in discussing academic stress or anxiety. Feel free to ask any questions about how my sessions work or what to expect before booking.
              </Text>
            </View>
            <Text style={styles.messageTime}>10:15 AM</Text>
          </View>

          {/* Sent Message */}
          <View style={styles.messageRowSent}>
            <View style={styles.messageBubbleSent}>
              <Text style={styles.messageTextSent}>
                Hi Dr. Anjali, I am struggling with exam pressure and wanted to check if video or anonymous text sessions are better for first-timers?
              </Text>
            </View>
            <View style={styles.messageTimeRow}>
              <Text style={styles.messageTime}>10:17 AM</Text>
              <Ionicons name="checkmark-done" size={14} color={colors.primary} />
              <Text style={styles.deliveredText}>Delivered</Text>
            </View>
          </View>

          {/* Received Message 2 */}
          <View style={styles.messageRowReceived}>
            <View style={styles.messageBubbleReceived}>
              <Text style={styles.messageTextReceived}>
                Either works wonderfully! If you prefer privacy, anonymous mode keeps your camera off and student ID hidden. We can pace it entirely according to your comfort level.
              </Text>
            </View>
            <Text style={styles.messageTime}>10:19 AM</Text>
          </View>

          {/* Typing Indicator */}
          <View style={styles.messageRowReceived}>
            <View style={styles.typingBubble}>
              <View style={styles.typingDotsRow}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
              <Text style={styles.typingText}>Dr. Anjali is typing...</Text>
            </View>
            <Text style={styles.messageTime}>10:19 AM</Text>
          </View>

        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputAreaContainer}>
          {/* Quick Prompts */}
          <View style={styles.quickPromptsHeader}>
            <Text style={styles.quickPromptsLabel}>QUICK PROMPTS</Text>
            <Ionicons name="sync-outline" size={16} color={colors.textSecondary} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickPromptsScroll} contentContainerStyle={styles.quickPromptsContent}>
            <View style={styles.promptPill}>
              <Text style={styles.promptText}>What are your session fees?</Text>
            </View>
            <View style={styles.promptPill}>
              <Text style={styles.promptText}>How does anonymous mode work?</Text>
            </View>
          </ScrollView>

          {/* Input Box */}
          <View style={styles.inputRow}>
            <Pressable style={styles.attachButton}>
              <Ionicons name="attach" size={24} color={colors.textSecondary} />
            </Pressable>
            
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Type your message to Dr. Anjali..."
                placeholderTextColor={colors.textSecondary}
              />
              <Ionicons name="happy-outline" size={20} color={colors.textSecondary} style={styles.emojiIcon} />
            </View>

            <Pressable style={styles.sendButton}>
              <Ionicons name="send" size={18} color="#FFF" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  doctorInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  doctorInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  doctorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  smallOnlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  statusText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  licensedBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  licensedText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  keyboardView: {
    flex: 1,
  },
  chatFeed: {
    flex: 1,
  },
  chatContent: {
    padding: spacing.md,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  dateSeparator: {
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  datePill: {
    backgroundColor: "#E6E1D3",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  messageRowReceived: {
    alignItems: "flex-start",
    maxWidth: "85%",
  },
  messageBubbleReceived: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  messageTextReceived: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  messageRowSent: {
    alignItems: "flex-end",
    alignSelf: "flex-end",
    maxWidth: "85%",
  },
  messageBubbleSent: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 20,
    borderTopRightRadius: 4,
    marginBottom: 4,
  },
  messageTextSent: {
    fontSize: 15,
    color: "#FFF",
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  messageTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deliveredText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
    gap: 8,
  },
  typingDotsRow: {
    flexDirection: "row",
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  typingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  inputAreaContainer: {
    backgroundColor: colors.background,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  quickPromptsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  quickPromptsLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  quickPromptsScroll: {
    marginBottom: spacing.md,
  },
  quickPromptsContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  promptPill: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promptText: {
    fontSize: 14,
    color: colors.primary,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  textInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  emojiIcon: {
    marginLeft: spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
