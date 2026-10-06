import {  db } from "@/firebase/config";
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
  arrayUnion, 
  deleteDoc, 
  updateDoc 
} from "firebase/firestore";

export type Message = {
  id: string;
  senderId: string;
  text: string;
  image?: string; // Optional base64 image data URL
  video?: string;
  audio?: string;
  document?: { name: string; base64: string };
  createdAt: Date;
  deletedFor?: string[];
  isDeleted?: boolean;
  status?: 'sent' | 'delivered' | 'read';
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
        image: data.image,
        video: data.video,
        audio: data.audio,
        document: data.document,
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
        deletedFor: data.deletedFor || [],
        isDeleted: data.isDeleted || false,
        status: data.status || 'sent',
      };
    });
    onUpdate(messages);
  });
}

export async function sendMessage(
  chatId: string, 
  senderId: string, 
  text: string, 
  image?: string,
  video?: string,
  audio?: string,
  document?: { name: string; base64: string }
): Promise<void> {
  const messagesRef = collection(db, "chats", chatId, "messages");
  
  const msgData: any = {
    senderId,
    text,
    createdAt: serverTimestamp(),
      status: 'sent',
  };
  if (image) msgData.image = image;
  if (video) msgData.video = video;
  if (audio) msgData.audio = audio;
  if (document) msgData.document = document;
  
  await addDoc(messagesRef, msgData);
  
  const chatRef = doc(db, "chats", chatId);
  await setDoc(chatRef, {
    lastMessage: text,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function deleteMessages(chatId: string, messageIds: string[], deleteForEveryone: boolean, userId: string): Promise<void> {
  const promises = messageIds.map(msgId => {
    const msgRef = doc(db, "chats", chatId, "messages", msgId);
    if (deleteForEveryone) {
      return updateDoc(msgRef, { 
        isDeleted: true,
        text: "",
        image: null,
        video: null,
        audio: null,
        document: null
      });
    } else {
      return updateDoc(msgRef, { deletedFor: arrayUnion(userId) });
    }
  });
  await Promise.all(promises);
}