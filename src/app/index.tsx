import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Input from "@/components/common/Input";
import Screen from "@/components/common/Screen";
import { typography } from "@/theme";
import { Text } from "react-native";

export default function Index() {
  return (
    <Screen>
      <Text style={typography.title}>Welcome Back</Text>
      <Card variant="success">
        <Text style={typography.body}>Anonymous Mode is on</Text>
      </Card>
      <Input
        label="Email or Student ID"
        icon="mail-outline"
        placeholder="student@university.edu"
      />
      <Input
        label="Password"
        icon="lock-closed-outline"
        isPassword
        placeholder="Enter your password"
      />
      <Button title="Log In" onPress={() => {}} />
      <Button
        title="Continue Anonymously"
        variant="secondary"
        onPress={() => {}}
        style={{ marginTop: 12 }}
      />
    </Screen>
  );
}
