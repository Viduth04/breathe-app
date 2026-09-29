import Button from "@/components/common/Button";
import { getAuthErrorMessage, logout } from "@/services/authService";
import { colors, spacing } from "@/theme";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

// After logout the group layouts see no user and redirect to Welcome
export default function LogoutButton({
  variant = "primary",
}: {
  variant?: "primary" | "secondary";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleLogout = async () => {
    setError(undefined);
    setLoading(true);
    try {
      await logout();
    } catch (e) {
      setError(getAuthErrorMessage(e));
      setLoading(false);
    }
  };

  return (
    <View>
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      <Button
        title="Log Out"
        icon="log-out-outline"
        variant={variant}
        onPress={handleLogout}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    fontSize: 14,
    color: colors.danger,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
});
