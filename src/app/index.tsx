import { auth, db } from "@/firebase/config";
import { signInAnonymously } from "firebase/auth";
import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import { Button, Text, View } from "react-native";

export default function Index() {
  const [status, setStatus] = useState("Not tested yet");

  const testFirebase = async () => {
    try {
      const user = await signInAnonymously(auth);
      await addDoc(collection(db, "test"), {
        uid: user.user.uid,
        createdAt: new Date(),
      });
      setStatus("✅ Firebase connected! UID: " + user.user.uid);
    } catch (e: any) {
      setStatus("❌ Error: " + e.message);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Text style={{ marginBottom: 20, textAlign: "center" }}>{status}</Text>
      <Button title="Test Firebase" onPress={testFirebase} />
    </View>
  );
}
