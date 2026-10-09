// Admin panel - Viduth (Member 1).

import { Alert, Platform } from "react-native";

// Yes/no confirmation that also works on web (Alert.alert shows no buttons there)
export function confirmAction({
  title,
  message,
  confirmText,
}: {
  title: string;
  message: string;
  confirmText: string;
}): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) =>
    Alert.alert(
      title,
      message,
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: confirmText, style: "destructive", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
}
