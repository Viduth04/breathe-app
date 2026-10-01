import { colors, radius } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabNavigationOptions } from "expo-router/js-tabs";
import { ColorValue, StyleSheet, View } from "react-native";

type IconName = keyof typeof Ionicons.glyphMap;

const PILL = { width: 56, height: 32 };

// Shared look for the student and counsellor tab bars
export const tabScreenOptions: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textSecondary,
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
  },
  tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
  tabBarIconStyle: PILL, // Default icon slot (31x28) is too narrow for the pill
};

// Tab icon: filled on a mint pill when active, outline otherwise
export function tabIcon(active: IconName, inactive: IconName) {
  return function TabIcon({
    focused,
    color,
  }: {
    focused: boolean;
    color: ColorValue;
  }) {
    return (
      <View style={[styles.pill, focused && styles.pillActive]}>
        <Ionicons
          name={focused ? active : inactive}
          size={22}
          color={color as string}
        />
      </View>
    );
  };
}

const styles = StyleSheet.create({
  pill: {
    ...PILL,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  pillActive: { backgroundColor: colors.selected },
});
