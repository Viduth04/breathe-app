import React, { useEffect, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase/config";
import { getOrCreateChat, subscribeToMessages, sendMessage, deleteMessages, Message } from "@/services/chatService";
import ChatUI from "@/components/chat/ChatUI";
import { FLOATING_HELP_CLEARANCE } from "@/components/crisis/UrgentHelpLink";

export default function ChatScreen() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const { user } = useAuth();
  
  const [counsellor, setCounsellor] = useState<any>(null);
  const [counsellorPhoto, setCounsellorPhoto] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (uid) {
      const unsub = onSnapshot(doc(db, "counsellors", uid as string), (snap) => {
        if (snap.exists()) {
          setCounsellor({ id: snap.id, ...snap.data() });
        }
      });
      
      const unsubPhoto = onSnapshot(doc(db, "counsellorPhotos", uid as string), (snap) => {
        if (snap.exists()) {
          setCounsellorPhoto(snap.data().photo);
        }
      });

      return () => { unsub(); unsubPhoto(); };
    }
  }, [uid]);

  const [chatData, setChatData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let unsubscribeMessages: () => void;
    let unsubscribeChat: () => void;
    
    const initChat = async () => {
      if (user?.uid && uid) {
        try {
          const id = await getOrCreateChat(user.uid, uid);
          setChatId(id);
          
          unsubscribeMessages = subscribeToMessages(id, (newMessages) => {
            setMessages(newMessages);
            setLoading(false);
          });
          
          unsubscribeChat = onSnapshot(doc(db, "chats", id), (snap) => {
            if (snap.exists()) setChatData(snap.data());
          });
          
          updateDoc(doc(db, "chats", id), { [`lastSeen_${user.uid}`]: serverTimestamp() }).catch(() => {});
          
        } catch (error) {
          console.error("Error setting up chat:", error);
          setLoading(false);
        }
      }
    };
    initChat();
    return () => {
      if (unsubscribeMessages) unsubscribeMessages();
      if (unsubscribeChat) unsubscribeChat();
    };
  }, [user?.uid, uid]);

  const handleSendMessage = async (text: string, audio?: string, image?: string, video?: string, document?: any) => {
    if (chatId && user?.uid) {
      await sendMessage(chatId, user.uid, text, image, video, audio, document);
    }
  };

  const handleDeleteMessages = async (messageIds: string[], forEveryone: boolean) => {
    if (chatId) {
      await deleteMessages(chatId, messageIds, forEveryone, user?.uid || "");
    }
  };

  
  const lastSeenField = chatData?.[(`lastSeen_${uid}`)];
  let isOnline = false;
  let statusText = "";
  let lastSeenDate: Date | undefined = undefined;

  if (lastSeenField) {
    lastSeenDate = lastSeenField.toDate ? lastSeenField.toDate() : new Date(lastSeenField.seconds * 1000);
    const diffMinutes = (currentTime - lastSeenDate.getTime()) / 60000;
    isOnline = diffMinutes < 1.5;
    
    if (isOnline) {
      statusText = "Online";
    } else {
      const isToday = new Date().toDateString() === lastSeenDate.toDateString();
      statusText = `Last seen ${isToday ? 'today at ' : ''}${lastSeenDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
  }

  const otherUser = {
    id: uid,
    name: counsellor?.fullName || "Counsellor",
    avatar: counsellorPhoto || counsellor?.avatar || "https://i.pravatar.cc/150?img=5",
    isOnline,
    statusText,
    lastSeenDate
  };

  return (
    <ChatUI
      currentUserId={user?.uid || ""}
      otherUser={otherUser}
      messages={messages}
      loading={loading}
      onSendMessage={handleSendMessage}
      onDeleteMessages={handleDeleteMessages}
      headerRightInset={FLOATING_HELP_CLEARANCE}
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
      }}
    />
  );
}
