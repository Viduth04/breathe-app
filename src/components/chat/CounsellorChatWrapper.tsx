import React, { useEffect, useState } from "react";
import ChatUI from "./ChatUI";
import { subscribeToMessages, sendMessage, deleteMessages, Message } from "@/services/chatService";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/context/AuthContext";

export default function CounsellorChatWrapper({ activeThread, onBack }: { activeThread: any, onBack: () => void }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const chatId = activeThread?.id;
  const [chatData, setChatData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let unsubscribeMessages: () => void;
    let unsubscribeChat: () => void;
    
    if (chatId) {
      setLoading(true);
      unsubscribeMessages = subscribeToMessages(chatId, (newMessages) => {
        setMessages(newMessages);
        setLoading(false);
      });
      
      unsubscribeChat = onSnapshot(doc(db, "chats", chatId), (snap) => {
        if (snap.exists()) setChatData(snap.data());
      });
      
      if (user?.uid) {
        updateDoc(doc(db, "chats", chatId), { [`lastSeen_${user.uid}`]: serverTimestamp() }).catch(() => {});
      }
    }
    return () => {
      if (unsubscribeMessages) unsubscribeMessages();
      if (unsubscribeChat) unsubscribeChat();
    };
  }, [chatId, user?.uid]);

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

  
  const otherId = activeThread?.studentId || "anon";
  const lastSeenField = chatData?.[(`lastSeen_${otherId}`)];
  let isOnline = false;
  let statusText = "";
  let lastSeenDate: Date | undefined = undefined;

  if (lastSeenField) {
    const validDate = lastSeenField.toDate ? lastSeenField.toDate() : new Date(lastSeenField.seconds * 1000);
    lastSeenDate = validDate;
    const diffMinutes = (currentTime - validDate.getTime()) / 60000;
    isOnline = diffMinutes < 1.5;
    
    if (isOnline) {
      statusText = "Online";
    } else {
      const isToday = new Date().toDateString() === validDate.toDateString();
      statusText = `Last seen ${isToday ? 'today at ' : ''}${validDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
  }

  const otherUser = {
    id: otherId,
    name: activeThread?.studentName || activeThread?.displayName || "Student",
    avatar: activeThread?.avatar || activeThread?.avatarUrl || `https://ui-avatars.com/api/?name=Student+${otherId.substring(0, 4)}&background=random`,
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
      onBack={onBack}
    />
  );
}
