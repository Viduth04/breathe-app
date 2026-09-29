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
    ],
  },
  {
    icon: "person-circle-outline",
    title: "What counsellors see",
    points: [
      "Counsellors only see your anonymous ID, never your name or email.",
      "They only see your mood check-ins if you turn on \"Share mood data with counsellor\" in Privacy & Data.",
    ],
  },
  {
    icon: "bar-chart-outline",
    title: "What lecturers see",
    points: [
      "Lecturers and faculty only see anonymised totals, such as how many students checked in this week.",
      "They never see who you are or any of your individual check-ins or bookings.",
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
    icon: "trash-outline",
    title: "Deleting your data",
    points: [
      "Go to Privacy & Data and tap Delete My Data.",
      "This permanently deletes your check-ins, bookings, profile and account. It can't be undone.",
      "If you registered with an email, you'll be asked for your password first so no one else can delete your account.",
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
