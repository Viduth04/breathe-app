// Breathe design system (from Milestone 02, Section 7)
// Secondary text darkened from #989689 to #6B6A5E to pass WCAG AA (R4)

export const colors = {
  primary: "#076047", // Deep green - primary buttons, active states
  background: "#FFF9EC", // Cream - app background
  surface: "#FFFFFF", // Cards, inputs, modals
  success: "#E5F8E4", // Mint - check-in card, confirmations
  selected: "#BCF4DB", // Mint accent - active tab, selected chips
  text: "#1C1C1E", // Headings and body text
  textSecondary: "#6B6A5E", // Helper text, timestamps (AA pass, 5.2:1)
  danger: "#C23232", // Destructive actions only
  dangerTint: "#FFECE4", // Background for destructive buttons
  border: "#E6E1D3", // Input and card borders
  white: "#FFFFFF",
  overlay: "rgba(28, 28, 30, 0.5)", // Dimmed backdrop behind modals (text color at 50%)
  frosted: "rgba(255, 255, 255, 0.7)", // Translucent white card over the gradient (Welcome)
};

// Top-to-bottom gradients (expo-linear-gradient); built from the palette above
export const gradients = {
  welcome: [colors.success, colors.background] as const, // Mint fading into cream
};

// Mood levels 1 (very low) to 5 (great); index = level - 1.
// Mood is ordinal, so it's one hue (our primary green) from light to dark.
// Each step is at least 8.3 OKLab units from the next, so levels stay distinct
// with colour-vision deficiencies. The two lightest are below 3:1 on white, so
// anything using them must also show text labels or a table (never colour alone).
export const moodColors = [
  "#A3DDC4",
  "#6ABE9D",
  "#389A77",
  "#1D8060",
  "#065A42",
] as const;

// Role badges in the admin panel; each role gets a distinct pairing from the palette
export const roleColors = {
  student: { background: colors.selected, text: colors.primary },
  counsellor: { background: colors.primary, text: colors.white },
  lecturer: { background: colors.border, text: colors.text },
  admin: { background: colors.text, text: colors.white },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 16,
  xl: 24,
  full: 999, // Fully rounded buttons
};

export const typography = {
  title: { fontSize: 28, fontWeight: "700" as const, color: colors.text },
  heading: { fontSize: 20, fontWeight: "600" as const, color: colors.text },
  body: { fontSize: 16, fontWeight: "400" as const, color: colors.text },
  caption: {
    fontSize: 13,
    fontWeight: "400" as const,
    color: colors.textSecondary,
  },
};

// Minimum touch target (NFR06 / WCAG)
export const TOUCH_TARGET = 48;

// Popup System Tokens - WCAG 2.1 AA Calibrated
export const popupColors = {
  // Success / Verified (Deep Green & Mint)
  successText: "#076047",
  successSurface: "#E5F8E4",
  successBorder: "#B9E8C7",

  // Warning / Attention (Warm amber ochre, not yellow)
  warningText: "#8A5B00",
  warningSurface: "#FEF3C7",
  warningBorder: "#FDE68A",

  // Destructive / Critical Error (Muted clinical terracotta clay, not alarming red)
  destructiveText: "#A33B3B",
  destructiveSurface: "#FDF2F2",
  destructiveBorder: "#FECACA",

  // Information / Clinical Note (Calm slate teal, not bright blue)
  infoText: "#1E5E7A",
  infoSurface: "#EBF5F9",
  infoBorder: "#BAE6FD",

  // Backdrop Scrim
  scrim: "rgba(27, 43, 36, 0.45)",
};
