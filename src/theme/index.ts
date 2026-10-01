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
};

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
