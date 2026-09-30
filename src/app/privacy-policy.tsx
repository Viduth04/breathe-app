import AuthHeader from "@/components/auth/AuthHeader";
import Card from "@/components/common/Card";
import Screen from "@/components/common/Screen";
import { colors, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

// Lives outside (auth) and (student) so it opens whether or not you're logged in
// (linked from Register and from Privacy & Data)

type Section = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  points: string[];
};

const SECTIONS: Section[] = [
  {
    icon: "folder-open-outline",
    title: "What we store",
    points: [
      "Your profile: your name, email, a random anonymous ID (like Student #4021) and your privacy settings. Guest accounts have no name or email.",
      "Your mood check-ins, so you can see how you've been feeling over time.",
      "Your counselling bookings, so you and your counsellor can manage appointments.",
      "Your chats with a counsellor. Only you and that counsellor can read them.",
      "Anonymous weekly totals: each check-in adds 1 to that week's count for the mood you picked. The totals don't include your name, email, anonymous ID or when you checked in, so they can't be linked back to you.",
    ],
  },
  {
    icon: "person-circle-outline",
    title: "What counsellors see",
    points: [
      "Counsellors only see your anonymous ID, never your name or email.",
      "Your mood check-ins are only visible to a counsellor you have a confirmed session with, and only while \"Share mood data with counsellor\" is turned on in Privacy & Data. Turn it off and they lose access straight away.",
    ],
  },
  {
    icon: "bar-chart-outline",
    title: "What lecturers see",
    points: [
      "Lecturers only see anonymous weekly totals: how many check-ins there were that week and how many were at each mood level, plus the weekly average.",
      "If a week has fewer than 5 check-ins, they don't see the mood breakdown or average for it at all, so no one can work out how one student felt.",
      "They never see who you are or any of your individual check-ins, bookings or chats.",
    ],
  },
  {
    icon: "options-outline",
    title: "Your choices",
    points: [
      "You can turn Anonymous Mode and mood sharing on or off at any time in Privacy & Data.",
    ],
  },
  {
    icon: "sparkles-outline",
    title: "AI Companion",
    points: [
      "When you use Breathe Companion, your chat messages are processed by Google's Gemini AI to generate a reply.",
      "We do not send your name, email, student ID, uid or anonymous ID to Gemini.",
      "Breathe Companion chats are kept only in memory on your device while that screen is open. They are not saved to our database, and Clear chat removes them immediately.",
      "Breathe Companion is an AI, not a counsellor, therapist or doctor. It does not diagnose or provide medical, medication or emergency advice. Use Crisis Support or call 1926 or 1990 in an emergency.",
    ],
  },
  {
    icon: "trash-outline",
    title: "Deleting your data",
    points: [
      "Go to Privacy & Data and tap Delete My Data.",
      "This permanently deletes your check-ins, bookings, chats and messages (including your counsellor's replies), profile and account. It can't be undone.",
      "If you registered with an email, you'll be asked for your password first so no one else can delete your account.",
      "Your past check-ins stay counted in the anonymous weekly totals. Those totals don't record who contributed, so there is no way to find and remove your part.",
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <Screen>
      <AuthHeader />

      <View style={styles.header}>
        <Text style={[typography.title, styles.center]} accessibilityRole="header">
          Privacy Policy
        </Text>
        <Text style={[typography.body, styles.subtitle]}>
          What Breathe stores, who can see it, and how to delete it
        </Text>
      </View>

      {SECTIONS.map((section) => (
        <Card key={section.title}>
          <View style={styles.titleRow}>
            <Ionicons
              name={section.icon}
              size={20}
              color={colors.primary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {section.title}
            </Text>
          </View>
          {section.points.map((point) => (
            <View key={point} style={styles.point}>
              <Text style={styles.bullet} importantForAccessibility="no">
                •
              </Text>
              <Text style={styles.pointText}>{point}</Text>
            </View>
          ))}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, marginBottom: spacing.lg },
  center: { textAlign: "center" },
  subtitle: { color: colors.textSecondary, textAlign: "center" },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...typography.heading, fontSize: 18, flexShrink: 1 },
  point: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  bullet: { ...typography.body, color: colors.primary },
  pointText: { ...typography.body, lineHeight: 24, flex: 1 },
});
