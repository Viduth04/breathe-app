// Filter & Action Row - Muaath (Member 4). Supports FR08.
// Includes segmented time scope controls and Add Session quick action.

import { colors, radius, spacing, TOUCH_TARGET } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type TimeFilter = "Day" | "Week" | "Month" | "Session History";

type Props = {
  activeFilter: TimeFilter;
  onSelectFilter: (filter: TimeFilter) => void;
  onAddSession: () => void;
};

const FILTERS: TimeFilter[] = ["Day", "Week", "Month", "Session History"];

export default function SegmentedControl({
  activeFilter,
  onSelectFilter,
  onAddSession,
}: Props) {
  return (
    <View style={styles.container}>
      {/* Segmented Filter Pills */}
      <View style={styles.filterGroup} accessibilityRole="tablist">
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <Pressable
              key={filter}
              onPress={() => onSelectFilter(filter)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${filter} view`}
              style={({ pressed }) => [
                styles.filterPill,
                isActive && styles.filterPillActive,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  isActive && styles.filterTextActive,
                ]}
                numberOfLines={1}
              >
                {filter}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* + Add Session Action Button */}
      <Pressable
        onPress={onAddSession}
        accessibilityRole="button"
        accessibilityLabel="Add Session"
        style={({ pressed }) => [
          styles.addButton,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name="add"
          size={16}
          color={colors.white}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <Text style={styles.addButtonText}>Add Session</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterGroup: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: radius.sm + 4,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(7, 96, 71, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  filterPill: {
    flex: 1,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    paddingHorizontal: 4,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  filterText: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textSecondary,
    textAlign: "center",
  },
  filterTextActive: {
    color: colors.white,
    fontWeight: "700",
  },
  addButton: {
    minHeight: TOUCH_TARGET - 4,
    paddingHorizontal: spacing.sm + 4,
    backgroundColor: colors.primary,
    borderRadius: radius.sm + 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
