import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Logo, { LeafMark } from "@/components/common/Logo";
import Screen from "@/components/common/Screen";
import UrgentHelpLink from "@/components/crisis/UrgentHelpLink";
import CheckInIllustration, {
  CHECK_IN_DESCRIPTION,
} from "@/components/onboarding/CheckInIllustration";
import TalkIllustration, {
  TALK_DESCRIPTION,
} from "@/components/onboarding/TalkIllustration";
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
import { ComponentType, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  NativeScrollEvent,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Slide = {
  title: string;
  subtitle: string;
  description: string; // Read by screen readers in place of the artwork
  // Slide 1 uses a bitmap; slides 2 and 3 are drawn with react-native-svg
  art:
    | { kind: "image"; source: ImageSource }
    | { kind: "svg"; Component: ComponentType<{ accessibilityLabel?: string }> };
};

const SLIDES: Slide[] = [
  {
    title: "Small steps toward feeling better",
    subtitle: "Check in daily. Book support privately. Your data stays yours.",
    description:
      "Illustration of a student meditating cross-legged among green leaves",
    art: { kind: "image", source: require("@/assets/images/onboarding-1.jpg") },
  },
  {
    title: "Check in with yourself",
    subtitle:
      "A quick, private mood check-in helps you notice patterns before stress builds up.",
    description: CHECK_IN_DESCRIPTION,
    art: { kind: "svg", Component: CheckInIllustration },
  },
  {
    title: "Talk to someone you trust",
    subtitle:
      "Book a counsellor when you're ready. Counsellors only see your anonymous ID.",
    description: TALK_DESCRIPTION,
    art: { kind: "svg", Component: TalkIllustration },
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
  const [listHeight, setListHeight] = useState(0);

  const isLast = index === SLIDES.length - 1;
  // The slides only get the space left above the dots and buttons, so the
  // artwork is sized from that (measured) height and leaves room for the text
  const panelSize = Math.max(
    120,
    Math.min(
      width - 2 * spacing.lg - 2 * spacing.sm,
      listHeight ? listHeight * 0.48 : height * 0.3,
      360,
    ),
  );

  const onListLayout = (e: LayoutChangeEvent) =>
    setListHeight(e.nativeEvent.layout.height);

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
    // Scrolls vertically if the text still doesn't fit on very short screens
    <ScrollView
      style={{ width }}
      contentContainerStyle={styles.slideScroll}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View
        style={styles.slide}
        accessible
        // The slide is read as one item, so the artwork description goes in its label
        accessibilityLabel={[
          `Slide ${i + 1} of ${SLIDES.length}`,
          item.description,
          item.title,
          item.subtitle,
        ].join(". ")}
      >
        <Card style={styles.card}>
          <View style={[styles.panel, { width: panelSize, height: panelSize }]}>
            {item.art.kind === "image" ? (
              <Image
                source={item.art.source}
                contentFit="contain"
                style={styles.image}
                accessibilityLabel={item.description}
              />
            ) : (
              <item.art.Component accessibilityLabel={item.description} />
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
    </ScrollView>
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
          extraData={panelSize}
          onLayout={onListLayout}
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
  // flex: 1 (not flexGrow) lets the list shrink so the buttons stay on screen
  list: { flex: 1 },
  slideScroll: { flexGrow: 1 },
  slide: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
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
