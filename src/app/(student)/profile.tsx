import LogoutButton from "@/components/auth/LogoutButton";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Placeholder from "@/components/navigation/Placeholder";
import { router } from "expo-router";
import { Text } from "react-native";
import { typography } from "@/theme";

export default function Profile() {
  return (
    <Placeholder
      title="Profile"
      owner="Ishara"
      requirements={["FR01", "NFR01"]}
    >
      <Card>
        <Text style={typography.heading}>Talk to Breathe Companion</Text>
        <Text style={[typography.caption, { marginTop: 8, marginBottom: 16 }]}>
          A private AI space for short, practical support.
        </Text>
        <Button
          title="Open Breathe Companion"
          icon="chatbubble-ellipses-outline"
          onPress={() => router.push("/(student)/companion")}
        />
      </Card>
      <Button
        title="Privacy & Data"
        variant="secondary"
        icon="shield-checkmark-outline"
        onPress={() => router.push("/(student)/privacy")}
      />
      <LogoutButton />
    </Placeholder>
  );
}
