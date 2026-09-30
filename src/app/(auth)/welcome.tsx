import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Logo, { LeafMark } from "@/components/common/Logo";
import Screen from "@/components/common/Screen";
import UrgentHelpLink from "@/components/crisis/UrgentHelpLink";
import {
  colors,
  gradients,
  radius,
  spacing,
  TOUCH_TARGET,
  typography,
} from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image, ImageSource } from "expo-image";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = keyof typeof Ionicons.glyphMap;

type Slide = {
  title: string;
  subtitle: string;
  // Real artwork; slides without one show the icon composition below
  image?: { source: ImageSource; description: string };
  icon: IconName;
  accents: [IconName, IconName];
};

const SLIDES: Slide[] = [
  {
    title: "Small steps toward feeling better",
    subtitle: "Check in daily. Book support privately. Your data stays yours.",
    image: {
      source: require("@/assets/images/onboarding-1.jpg"),
      description:
        "Illustration of a student meditating cross-legged among green leaves",
    },
    icon: "leaf",
    accents: ["sunny-outline", "heart-outline"],
  },
  {
    title: "Check in, in under 2 minutes",
    subtitle:
      "A quick private mood check-in helps you notice patterns before stress builds up.",
    // TODO: add the slide 2 illustration (image: { source, description })
    icon: "happy",
    accents: ["time-outline", "stats-chart-outline"],
  },
  {
    title: "Support on your terms",
    subtitle:
      "Book a counsellor anonymously. Your data is never shared with lecturers.",
    // TODO: add the slide 3 illustration (image: { source, description })
    icon: "chatbubbles",
    accents: ["shield-checkmark-outline", "calendar-outline"],
  },
];

const DOT = 8;
const DOT_ACTIVE = 24;

export default function Welcome() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const listRef = useRef<FlatList<Slide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;
  // Keep the card small enough that everything fits on short phones
  const panelSize = Math.min(
    width - 2 * spacing.lg - 2 * spacing.sm,
    height * 0.34,
    360,
  );

  const goToLogin = () => router.push("/(auth)/login");

  const goTo = (i: number) =>
    listRef.current?.scrollToOffset({ offset: i * width, animated: !reduceMotion });

  // Keeps the dots, Skip and the button in sync with swipes
  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false, // Dot width can't be animated natively
      listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const i = Math.round(e.nativeEvent.contentOffset.x / width);
        if (i !== index && i >= 0 && i < SLIDES.length) setIndex(i);
      },
    },
  );

  const renderSlide = ({ item, index: i }: { item: Slide; index: number }) => (
    <View
      style={[styles.slide, { width }]}
      accessible
      // The slide is read as one item, so the image description goes in its label
      accessibilityLabel={[
        `Slide ${i + 1} of ${SLIDES.length}`,
        item.image?.description,
        item.title,
        item.subtitle,
      ]
        .filter(Boolean)
        .join(". ")}
    >
      <Card style={styles.card}>
        <View style={[styles.panel, { width: panelSize, height: panelSize }]}>
          {item.image ? (
            <Image
              source={item.image.source}
              contentFit="contain"
              style={styles.image}
              accessibilityLabel={item.image.description}
            />
          ) : (
            <>
              <View style={styles.iconCircle}>
                <Ionicons
                  name={item.icon}
                  size={panelSize * 0.28}
                  color={colors.primary}
                />
              </View>
              <View style={[styles.accent, styles.accentTop]}>
                <Ionicons name={item.accents[0]} size={22} color={colors.primary} />
              </View>
              <View style={[styles.accent, styles.accentLeft]}>
                <Ionicons name={item.accents[1]} size={22} color={colors.primary} />
              </View>
            </>
          )}
        </View>
        <View style={styles.chip}>
          <LeafMark size={14} />
          <Text style={styles.chipText}>Safe Space</Text>
        </View>
      </Card>

      <View style={styles.copy}>
        <Text style={[typography.title, styles.center]}>{item.title}</Text>
        <Text style={[styles.subtitle, styles.center]}>{item.subtitle}</Text>
      </View>
    </View>
  );

  return (
    <Screen scroll={false} gradient={gradients.welcome}>
      <View style={[styles.container, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.topBar}>
          <Logo size={24} showWordmark />
          {!isLast ? (
            <Pressable
              onPress={goToLogin}
              accessibilityRole="button"
              accessibilityLabel="Skip introduction"
              style={styles.skip}
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          ) : null}
        </View>

        <Animated.FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(item) => item.title}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          style={styles.list}
        />

        <View style={styles.dots}>
          {SLIDES.map((slide, i) => {
            const range = [(i - 1) * width, i * width, (i + 1) * width];
            // With reduced motion the dots switch instantly instead of stretching
            const dotStyle = reduceMotion
              ? {
                  width: i === index ? DOT_ACTIVE : DOT,
                  backgroundColor: i === index ? colors.primary : colors.border,
                }
              : {
                  width: scrollX.interpolate({
                    inputRange: range,
                    outputRange: [DOT, DOT_ACTIVE, DOT],
                    extrapolate: "clamp",
                  }),
                  backgroundColor: scrollX.interpolate({
                    inputRange: range,
                    outputRange: [colors.border, colors.primary, colors.border],
                    extrapolate: "clamp",
                  }),
                };
            return (
              <Pressable
                key={slide.title}
                onPress={() => goTo(i)}
                accessibilityRole="button"
                accessibilityLabel={`Go to slide ${i + 1} of ${SLIDES.length}`}
                accessibilityState={{ selected: i === index }}
                style={styles.dotTarget}
              >
                <Animated.View style={[styles.dot, dotStyle]} />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Button
            title={isLast ? "Get Started" : "Next"}
            icon="arrow-forward"
            onPress={isLast ? goToLogin : () => goTo(index + 1)}
          />
          <View style={styles.privacy}>
            <Ionicons
              name="shield-checkmark"
              size={16}
              color={colors.primary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={typography.caption}>
              Support that respects your privacy
            </Text>
          </View>
          <UrgentHelpLink />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    height: TOUCH_TARGET,
    justifyContent: "center",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  skip: {
    position: "absolute",
    right: spacing.md,
    minWidth: TOUCH_TARGET,
    minHeight: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },
  skipText: { fontSize: 16, fontWeight: "600", color: colors.primary },
  list: { flexGrow: 1 },
  slide: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    alignItems: "center",
    gap: spacing.lg,
  },
  card: {
    padding: spacing.sm,
    marginBottom: 0,
    backgroundColor: colors.frosted,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  panel: {
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden", // Rounds the illustration's corners with the panel
  },
  image: { width: "100%", height: "100%" },
  iconCircle: {
    width: "56%",
    aspectRatio: 1,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  accent: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.selected,
    alignItems: "center",
    justifyContent: "center",
  },
  accentTop: { top: "14%", right: "14%" },
  accentLeft: { bottom: "20%", left: "12%" },
  chip: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.text },
  copy: { gap: spacing.sm, maxWidth: 480 },
  center: { textAlign: "center" },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  // 48px touch target around each small dot
  dotTarget: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { height: DOT, borderRadius: radius.full },
  footer: { paddingHorizontal: spacing.lg, gap: spacing.md },
  privacy: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
});
