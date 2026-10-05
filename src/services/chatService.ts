import { db } from "@/firebase/config";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export type Message = {
  id: string;
  senderId: string;
  text: string;
  createdAt: Date;
};

export type Chat = {
  id: string;
  participants: string[];
  lastMessage?: string;
  updatedAt?: Date;
};

export async function getOrCreateChat(studentUid: string, counsellorUid: string): Promise<string> {
  const chatsRef = collection(db, "chats");
  
  const q = query(chatsRef, where("participants", "array-contains", studentUid));
  const snap = await getDocs(q);
  
  const existingChat = snap.docs.find(d => d.data().participants.includes(counsellorUid));
  
  if (existingChat) {
    return existingChat.id;
  }
  
  const chatId = `${studentUid}_${counsellorUid}`;
  const chatRef = doc(db, "chats", chatId);
  
  await setDoc(chatRef, {
    participants: [studentUid, counsellorUid],
    updatedAt: serverTimestamp(),
  });
  
  return chatId;
}

export function subscribeToMessages(chatId: string, onUpdate: (messages: Message[]) => void) {
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));
  
  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        senderId: data.senderId,
        text: data.text,
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
      };
    });
    onUpdate(messages);
  });
}

export async function sendMessage(chatId: string, senderId: string, text: string): Promise<void> {
  const messagesRef = collection(db, "chats", chatId, "messages");
  
  await addDoc(messagesRef, {
    senderId,
    text,
    createdAt: serverTimestamp(),
  });
  
  const chatRef = doc(db, "chats", chatId);
  await setDoc(chatRef, {
    lastMessage: text,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
