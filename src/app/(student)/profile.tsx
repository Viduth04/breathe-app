import LogoutButton from "@/components/auth/LogoutButton";
import Button from "@/components/common/Button";
import Placeholder from "@/components/navigation/Placeholder";
import { router } from "expo-router";

export default function Profile() {
  return (
    <Placeholder
      title="Profile"
      owner="Ishara"
      requirements={["FR01", "NFR01"]}
    >
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
