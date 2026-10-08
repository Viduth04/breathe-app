import React, { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { colors, radius, spacing } from "@/theme";
import { useLocalSearchParams, router } from "expo-router";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase/config";
import { getOrCreateChat, subscribeToMessages, sendMessage, deleteMessages, Message } from "@/services/chatService";
import ChatUI from "@/components/chat/ChatUI";
import { FLOATING_HELP_CLEARANCE } from "@/components/crisis/UrgentHelpLink";

export default function ChatScreen() {
  const { uid, bookingId } = useLocalSearchParams<{ uid: string; bookingId?: string }>();
  const { user } = useAuth();
  
  const [counsellor, setCounsellor] = useState<any>(null);
  const [counsellorPhoto, setCounsellorPhoto] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

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
    if (!lastSeenDate) return statusText;
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
    <>
      <ChatUI
      currentUserId={user?.uid || ""}
      otherUser={otherUser}
      messages={messages}
      loading={loading}
      onSendMessage={handleSendMessage}
      onDeleteMessages={handleDeleteMessages}
      headerRightInset={FLOATING_HELP_CLEARANCE}
      onBack={() => {
        if (bookingId) {
          setShowEndModal(true);
        } else {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/');
          }
        }
      }}
    />

    {/* End Consultation Modal for Web Compatibility */}
    <Modal visible={showEndModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>End Consultation?</Text>
          <Text style={styles.modalSubtitle}>Are you done with your consultation?</Text>
          
          <Pressable 
            style={[styles.modalBtn, styles.modalBtnPrimary]} 
            onPress={() => {
                if (!bookingId) {
                  console.error("No bookingId provided to chat!");
                  setShowEndModal(false);
                  if (router.canGoBack()) router.back();
                  else router.replace('/');
                  return;
                }
                
                setIsCompleting(true);
                
                try {
                  const bId = Array.isArray(bookingId) ? bookingId[0] : bookingId;
                  const cId = Array.isArray(uid) ? uid[0] : uid;
                  
                  const bookingRef = doc(db, "bookings", bId);
                  updateDoc(bookingRef, {
                    status: "completed",
                    updatedAt: serverTimestamp(),
                  }).catch(error => {
                    console.error("Failed to complete:", error);
                  });
                  
                  setShowEndModal(false);
                  router.replace({
                    pathname: "/(student)/session/review",
                    params: { id: bId, counsellorId: cId },
                  });
                } catch (err) {
                  console.error("Sync error in chat completion:", err);
                  setIsCompleting(false);
                  setShowEndModal(false);
                  router.replace("/(student)/session/dashboard");
                }
              }}
            disabled={isCompleting}
          >
            {isCompleting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalBtnTextPrimary}>Mark as Completed</Text>}
          </Pressable>

          <Pressable 
            style={[styles.modalBtn, styles.modalBtnSecondary]} 
            onPress={() => {
              setShowEndModal(false);
              if (router.canGoBack()) router.back();
              else router.replace('/');
            }}
          >
            <Text style={styles.modalBtnTextSecondary}>Leave Chat</Text>
          </Pressable>

          <Pressable 
            style={styles.modalBtnCancel} 
            onPress={() => setShowEndModal(false)}
          >
            <Text style={styles.modalBtnTextCancel}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  modalBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: radius.full,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalBtnPrimary: {
    backgroundColor: colors.primary,
  },
  modalBtnTextPrimary: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  modalBtnTextSecondary: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalBtnCancel: {
    paddingVertical: spacing.md,
  },
  modalBtnTextCancel: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  }
});
