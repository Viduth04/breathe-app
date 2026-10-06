import React, { useState, useRef } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Audio } from "expo-av";
import EmojiPicker from "rn-emoji-keyboard";

import { colors, radius, spacing, typography } from "@/theme";
import AudioMessage from "./AudioMessage";
import { Message } from "@/services/chatService";

const getDateLabel = (timestamp: any) => {
  if (!timestamp) return "";
  let date;
  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (typeof timestamp === "number") {
    date = new Date(timestamp);
  } else {
    date = new Date(timestamp.seconds * 1000);
  }
  if (isNaN(date.getTime())) return "";
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dateString = date.toLocaleDateString("en-LK", { timeZone: "Asia/Colombo" });
  const todayString = today.toLocaleDateString("en-LK", { timeZone: "Asia/Colombo" });
  const yesterdayString = yesterday.toLocaleDateString("en-LK", { timeZone: "Asia/Colombo" });
  
  if (dateString === todayString) return "Today";
  if (dateString === yesterdayString) return "Yesterday";
  
  const diffTime = Math.abs(today.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 7) {
    return date.toLocaleDateString("en-LK", { weekday: "long", timeZone: "Asia/Colombo" });
  }
  
  return date.toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Colombo" });
};

export interface ChatUIProps {
  currentUserId: string;
  otherUser: {
    name: string;
    avatar: string;
    isOnline: boolean;
    statusText: string;
    lastSeenDate?: Date;
  };
  messages: Message[];
  loading: boolean;
  onSendMessage: (text: string, audio?: string, image?: string, video?: string, document?: any) => Promise<void>;
  onDeleteMessages: (messageIds: string[], forEveryone: boolean) => Promise<void>;
  onBack: () => void;
  // Extra right padding for the header (the student area's floating crisis button)
  headerRightInset?: number;
}

export default function ChatUI({
  currentUserId,
  otherUser,
  messages,
  loading,
  onSendMessage,
  onDeleteMessages,
  onBack,
  headerRightInset,
}: ChatUIProps) {
  const [inputText, setInputText] = useState("");
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [meterings, setMeterings] = useState<number[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleSelection = (id: string) => {
    setSelectedMessages(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleLongPress = (id: string) => {
    if (selectedMessages.length === 0) {
      setSelectedMessages([id]);
    }
  };

  const handlePress = (id: string) => {
    if (selectedMessages.length > 0) {
      toggleSelection(id);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedMessages.length > 0) {
      setShowDeleteModal(true);
    }
  };

  const executeDelete = async (forEveryone: boolean) => {
    try {
      await onDeleteMessages(selectedMessages, forEveryone);
    } catch (e) {
      console.warn("Delete failed", e);
    } finally {
      setShowDeleteModal(false);
      setSelectedMessages([]);
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === "granted") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        
        newRecording.setProgressUpdateInterval(100);
        setRecording(newRecording);
        setIsRecording(true);
        setMeterings([]);
        setRecordingDuration(0);

        newRecording.setOnRecordingStatusUpdate((status) => {
          setRecordingDuration(status.durationMillis);
          if (status.isRecording) {
            const meter = status.metering !== undefined ? status.metering : (Math.random() * 40 - 60);
            setMeterings((prev) => [...prev.slice(-20), meter]);
          }
        });
      }
    } catch (e) {
      console.warn("Failed to start recording", e);
    }
  };

  const stopRecordingAndSend = async () => {
    if (!recording) return;
    setIsRecording(false);
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setMeterings([]);
      
      if (uri) {
        let base64Audio;
        if (Platform.OS === 'web') {
          const response = await fetch(uri);
          const blob = await response.blob();
          base64Audio = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } else {
          const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          base64Audio = `data:audio/m4a;base64,${base64}`;
        }
        await onSendMessage("", base64Audio as string, undefined, undefined, undefined);
      }
    } catch (error) {
      console.error('Failed to send recording', error);
      Alert.alert("Error", "Failed to process recording.");
    }
  };

  const cancelRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
    } catch (e) {}
    setRecording(null);
    setMeterings([]);
  };

  const handleAttachVideo = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.5,
    });
    if (!result.canceled && result.assets && result.assets[0].uri) {
      try {
        let base64Video;
        if (Platform.OS === 'web') {
           const response = await fetch(result.assets[0].uri);
           const blob = await response.blob();
           base64Video = await new Promise((resolve, reject) => {
             const reader = new FileReader();
             reader.onloadend = () => resolve(reader.result);
             reader.onerror = reject;
             reader.readAsDataURL(blob);
           });
        } else {
           const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: FileSystem.EncodingType.Base64 });
           base64Video = `data:video/mp4;base64,${base64}`;
        }
        await onSendMessage("", undefined, undefined, base64Video as string, undefined);
      } catch (e) {
        Alert.alert("Error", "File too large to upload.");
      }
    }
  };

  const handleAttach = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets) {
      const b64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      await onSendMessage("", undefined, b64, undefined, undefined);
    }
  };

  const handleAttachDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        let base64File;
        if (Platform.OS === 'web') {
            const response = await fetch(file.uri);
            const blob = await response.blob();
            base64File = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
        } else {
            base64File = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
            base64File = `data:application/octet-stream;base64,${base64File}`;
        }
        
        await onSendMessage("", undefined, undefined, undefined, {
          name: file.name,
          base64: base64File
        });
      }
    } catch (err) {
      console.error("Error picking document", err);
    }
  };

  const handleAttachAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        let base64File;
        if (Platform.OS === 'web') {
            const response = await fetch(file.uri);
            const blob = await response.blob();
            base64File = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
        } else {
            base64File = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
            base64File = `data:audio/mp3;base64,${base64File}`;
        }
        await onSendMessage("", base64File as string, undefined, undefined, undefined);
      }
    } catch (err) {
      console.error("Error picking audio", err);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText("");
    await onSendMessage(text);
  };

  const groupedMessages = messages.reduce((acc: any[], msg: Message) => {
    // If the message is deleted for the current user, don't show it at all
    if (msg.deletedFor && msg.deletedFor.includes(currentUserId)) {
      return acc;
    }

    const label = getDateLabel(msg.createdAt);
    const lastGroup = acc[acc.length - 1];
    if (lastGroup && lastGroup.label === label) {
      lastGroup.messages.push(msg);
    } else {
      acc.push({ label, messages: [msg] });
    }
    return acc;
  }, []);

  const canDeleteForEveryone = selectedMessages.every(id => {
    const msg = messages.find(m => m.id === id);
    if (!msg || msg.senderId !== currentUserId) return false;
    const createdAt = msg.createdAt instanceof Date ? msg.createdAt : 
                      (msg.createdAt as any)?.toDate ? (msg.createdAt as any).toDate() : 
                      new Date((msg.createdAt as any)?.seconds * 1000);
    return (new Date().getTime() - createdAt.getTime()) <= 86400000; // 24 hours
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {selectedMessages.length > 0 ? (
          <View style={[styles.doctorInfoCard, { marginTop: 8 }, headerRightInset ? { paddingRight: headerRightInset } : null]}>
            <View style={styles.doctorInfoLeft}>
              <Pressable onPress={() => setSelectedMessages([])} style={[styles.backButton, { borderWidth: 0, backgroundColor: 'transparent' }]}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
              <Text style={styles.doctorName}>{selectedMessages.length} selected</Text>
            </View>
            <Pressable onPress={handleDeleteSelected} style={{ marginRight: 16 }}>
              <Ionicons name="trash" size={24} color={colors.danger} />
            </Pressable>
          </View>
        ) : (
          <View style={[styles.doctorInfoCard, { marginTop: 8 }, headerRightInset ? { paddingRight: headerRightInset } : null]}>
            <View style={styles.doctorInfoLeft}>
              <Pressable onPress={onBack} style={[styles.backButton, { borderWidth: 0, backgroundColor: 'transparent' }]}>
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </Pressable>
              <View>
                <Image
                  source={{ uri: otherUser?.avatar || "https://i.pravatar.cc/150?img=5" }}
                  style={styles.doctorAvatar}
                />
                {otherUser?.isOnline ? <View style={styles.onlineDot} /> : <View style={[styles.onlineDot, {backgroundColor: colors.textSecondary}]} />}
              </View>
              <View>
                <Text style={styles.doctorName}>{otherUser?.name || "User"}</Text>
                <View style={styles.statusRow}>
                  
                  {!!otherUser?.statusText && <Text style={styles.statusText}>{otherUser.statusText}</Text>}
                </View>
              </View>
            </View>
          </View>
        )}

        {(() => {
          if (loading) {
            return (
              <View style={[styles.chatFeed, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            );
          }
          if (messages.length === 0) {
            return (
              <View style={[styles.chatFeed, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{color: colors.textSecondary}}>Say hi!</Text>
              </View>
            );
          }
          
          return (
            <ScrollView 
              style={styles.chatFeed} 
              contentContainerStyle={styles.chatContent} 
              showsVerticalScrollIndicator={false}
              ref={scrollViewRef}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              onTouchStart={() => {
                if (showAttachmentMenu) setShowAttachmentMenu(false);
                if (isEmojiPickerOpen) setIsEmojiPickerOpen(false);
              }}
            >
              {Platform.OS === 'web' ? (
                groupedMessages.map((group, groupIndex) => (
                  <View key={group.label || groupIndex} style={{ zIndex: groupedMessages.length - groupIndex }}>
                    <View style={styles.dateHeaderContainerSticky}>
                      <Text style={styles.dateHeaderText}>{group.label}</Text>
                    </View>
                    {group.messages.map((msg: Message, index: number) => {
                      const isSent = msg.senderId === currentUserId;
                      const formattedTime = new Intl.DateTimeFormat("en-LK", {
                        hour: "numeric",
                        minute: "numeric",
                      }).format(
                        msg.createdAt instanceof Date ? msg.createdAt : 
                        (msg.createdAt as any)?.toDate ? (msg.createdAt as any).toDate() : 
                        new Date((msg.createdAt as any)?.seconds * 1000 || Date.now())
                      );
                      
                      if (msg.isDeleted) {
                        return (
                          <View key={msg.id || index} style={isSent ? styles.messageRowSent : styles.messageRowReceived}>
                            <View style={[isSent ? styles.messageBubbleSent : styles.messageBubbleReceived, { backgroundColor: isSent ? 'rgba(0,100,0,0.05)' : colors.surface, borderWidth: 1, borderColor: colors.border }]}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="ban-outline" size={16} color={colors.textSecondary} />
                                <Text style={{ fontStyle: 'italic', color: colors.textSecondary, fontSize: 14 }}>
                                  {isSent ? "You deleted this message" : "This message was deleted"}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.messageTimeRow}>
                              <Text style={styles.messageTime}>{formattedTime}</Text>
                            </View>
                          </View>
                        );
                      }

                      return isSent ? (
                        <Pressable 
                          key={msg.id || index} 
                          onLongPress={() => handleLongPress(msg.id)}
                          onPress={() => handlePress(msg.id)}
                          style={[
                            { width: '100%', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 12, marginVertical: 2 },
                            selectedMessages.includes(msg.id) && { backgroundColor: 'rgba(21, 146, 110, 0.15)' }
                          ]}
                        >
                          <View style={styles.messageRowSent}>
                            <View style={styles.messageBubbleSent}>
                            {msg.image ? (
                              <Image source={{ uri: msg.image }} style={{ width: 200, height: 200, borderRadius: 8, marginBottom: 4 }} />
                            ) : null}
                            {msg.video ? (
                              <View style={{ width: 200, height: 150, backgroundColor: '#000', borderRadius: 8, marginBottom: 4, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="play-circle" size={40} color="#FFF" />
                                <Text style={{color: '#FFF', fontSize: 10}}>Video Attachment</Text>
                              </View>
                            ) : null}
                            {msg.audio ? <AudioMessage audioUri={msg.audio} isSent={isSent} /> : null}
                            {msg.document ? (
                              <View style={{ width: 200, backgroundColor: colors.surface, borderRadius: 8, marginBottom: 4, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 }}>
                                <Ionicons name="document" size={24} color={colors.primary} />
                                <Text style={{flex: 1, color: colors.text, fontSize: 12}} numberOfLines={1}>{msg.document.name}</Text>
                              </View>
                            ) : null}
                            {msg.text && !['Sent a voice message', 'Sent an audio clip', 'Sent an image', 'Sent a video', 'Sent a document'].includes(msg.text) ? <Text style={styles.messageTextSent}>{msg.text}</Text> : null}
                            </View>
                            <View style={styles.messageTimeRow}>
                              <Text style={styles.messageTime}>{formattedTime}</Text>
                              {(() => {
                                let tickIcon = "checkmark";
                                let tickColor = colors.textSecondary;
                                
                                const msgDate = msg.createdAt instanceof Date ? msg.createdAt : (msg.createdAt as any)?.toDate ? (msg.createdAt as any).toDate() : new Date((msg.createdAt as any)?.seconds * 1000 || Date.now());
                                
                                const isRead = msg.status === 'read' || (otherUser?.lastSeenDate && msgDate <= otherUser.lastSeenDate);
                                
                                if (isRead) {
                                  tickIcon = "checkmark-done";
                                  tickColor = "#34B7F1";
                                } else if (msg.status === 'delivered') {
                                  tickIcon = "checkmark-done";
                                }
                                return <Ionicons name={tickIcon as any} size={16} color={tickColor} style={{ marginLeft: 2 }} />;
                              })()}
                            </View>
                          </View>
                        </Pressable>
                      ) : (
                        <Pressable 
                          key={msg.id || `recv-${index}`} 
                          onLongPress={() => handleLongPress(msg.id)}
                          onPress={() => handlePress(msg.id)}
                          style={[
                            { width: '100%', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 12, marginVertical: 2 },
                            selectedMessages.includes(msg.id) && { backgroundColor: 'rgba(21, 146, 110, 0.15)' }
                          ]}
                        >
                          <View style={styles.messageRowReceived}>
                            <View style={styles.messageBubbleReceived}>
                            {msg.image ? (
                              <Image source={{ uri: msg.image }} style={{ width: 200, height: 200, borderRadius: 8, marginBottom: 4 }} />
                            ) : null}
                            {msg.video ? (
                              <View style={{ width: 200, height: 150, backgroundColor: '#000', borderRadius: 8, marginBottom: 4, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="play-circle" size={40} color="#FFF" />
                                <Text style={{color: '#FFF', fontSize: 10}}>Video Attachment</Text>
                              </View>
                            ) : null}
                            {msg.audio ? <AudioMessage audioUri={msg.audio} isSent={isSent} /> : null}
                            {msg.document ? (
                              <View style={{ width: 200, backgroundColor: colors.surface, borderRadius: 8, marginBottom: 4, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 }}>
                                <Ionicons name="document" size={24} color={colors.primary} />
                                <Text style={{flex: 1, color: colors.text, fontSize: 12}} numberOfLines={1}>{msg.document.name}</Text>
                              </View>
                            ) : null}
                            {msg.text && !['Sent a voice message', 'Sent an audio clip', 'Sent an image', 'Sent a video', 'Sent a document'].includes(msg.text) ? <Text style={styles.messageTextReceived}>{msg.text}</Text> : null}
                            </View>
                            <Text style={styles.messageTime}>{formattedTime}</Text>
                          </View>
                        </Pressable>
                      )
                    })}
                  </View>
                ))
              ) : (
                groupedMessages.map((group, groupIndex) => (
                  <View key={group.label || groupIndex}>
                    <View style={styles.dateHeaderContainer}>
                      <Text style={styles.dateHeaderText}>{group.label}</Text>
                    </View>
                    {group.messages.map((msg: Message, index: number) => {
                      const isSent = msg.senderId === currentUserId;
                      const formattedTime = new Intl.DateTimeFormat("en-LK", {
                        hour: "numeric",
                        minute: "numeric",
                      }).format(
                        msg.createdAt instanceof Date ? msg.createdAt : 
                        (msg.createdAt as any)?.toDate ? (msg.createdAt as any).toDate() : 
                        new Date((msg.createdAt as any)?.seconds * 1000 || Date.now())
                      );
                      
                      if (msg.isDeleted) {
                        return (
                          <View key={msg.id || index} style={isSent ? styles.messageRowSent : styles.messageRowReceived}>
                            <View style={[isSent ? styles.messageBubbleSent : styles.messageBubbleReceived, { backgroundColor: isSent ? 'rgba(0,100,0,0.05)' : colors.surface, borderWidth: 1, borderColor: colors.border }]}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="ban-outline" size={16} color={colors.textSecondary} />
                                <Text style={{ fontStyle: 'italic', color: colors.textSecondary, fontSize: 14 }}>
                                  {isSent ? "You deleted this message" : "This message was deleted"}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.messageTimeRow}>
                              <Text style={styles.messageTime}>{formattedTime}</Text>
                            </View>
                          </View>
                        );
                      }

                      return isSent ? (
                        <Pressable 
                          key={msg.id || index} 
                          onLongPress={() => handleLongPress(msg.id)}
                          onPress={() => handlePress(msg.id)}
                          style={[
                            { width: '100%', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 12, marginVertical: 2 },
                            selectedMessages.includes(msg.id) && { backgroundColor: 'rgba(21, 146, 110, 0.15)' }
                          ]}
                        >
                          <View style={styles.messageRowSent}>
                            <View style={styles.messageBubbleSent}>
                            {msg.image ? (
                              <Image source={{ uri: msg.image }} style={{ width: 200, height: 200, borderRadius: 8, marginBottom: 4 }} />
                            ) : null}
                            {msg.video ? (
                              <View style={{ width: 200, height: 150, backgroundColor: '#000', borderRadius: 8, marginBottom: 4, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="play-circle" size={40} color="#FFF" />
                                <Text style={{color: '#FFF', fontSize: 10}}>Video Attachment</Text>
                              </View>
                            ) : null}
                            {msg.audio ? <AudioMessage audioUri={msg.audio} isSent={isSent} /> : null}
                            {msg.document ? (
                              <View style={{ width: 200, backgroundColor: colors.surface, borderRadius: 8, marginBottom: 4, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 }}>
                                <Ionicons name="document" size={24} color={colors.primary} />
                                <Text style={{flex: 1, color: colors.text, fontSize: 12}} numberOfLines={1}>{msg.document.name}</Text>
                              </View>
                            ) : null}
                            {msg.text && !['Sent a voice message', 'Sent an audio clip', 'Sent an image', 'Sent a video', 'Sent a document'].includes(msg.text) ? <Text style={styles.messageTextSent}>{msg.text}</Text> : null}
                            </View>
                            <View style={styles.messageTimeRow}>
                              <Text style={styles.messageTime}>{formattedTime}</Text>
                              {(() => {
                                let tickIcon = "checkmark";
                                let tickColor = colors.textSecondary;
                                if (msg.status === 'read') {
                                  tickIcon = "checkmark-done";
                                  tickColor = "#34B7F1";
                                } else if (msg.status === 'delivered' || otherUser?.isOnline) {
                                  tickIcon = "checkmark-done";
                                }
                                return <Ionicons name={tickIcon as any} size={16} color={tickColor} style={{ marginLeft: 2 }} />;
                              })()}
                            </View>
                          </View>
                        </Pressable>
                      ) : (
                        <Pressable 
                          key={msg.id || `recv-${index}`} 
                          onLongPress={() => handleLongPress(msg.id)}
                          onPress={() => handlePress(msg.id)}
                          style={[
                            { width: '100%', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 12, marginVertical: 2 },
                            selectedMessages.includes(msg.id) && { backgroundColor: 'rgba(21, 146, 110, 0.15)' }
                          ]}
                        >
                          <View style={styles.messageRowReceived}>
                            <View style={styles.messageBubbleReceived}>
                            {msg.image ? (
                              <Image source={{ uri: msg.image }} style={{ width: 200, height: 200, borderRadius: 8, marginBottom: 4 }} />
                            ) : null}
                            {msg.video ? (
                              <View style={{ width: 200, height: 150, backgroundColor: '#000', borderRadius: 8, marginBottom: 4, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="play-circle" size={40} color="#FFF" />
                                <Text style={{color: '#FFF', fontSize: 10}}>Video Attachment</Text>
                              </View>
                            ) : null}
                            {msg.audio ? <AudioMessage audioUri={msg.audio} isSent={isSent} /> : null}
                            {msg.document ? (
                              <View style={{ width: 200, backgroundColor: colors.surface, borderRadius: 8, marginBottom: 4, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 }}>
                                <Ionicons name="document" size={24} color={colors.primary} />
                                <Text style={{flex: 1, color: colors.text, fontSize: 12}} numberOfLines={1}>{msg.document.name}</Text>
                              </View>
                            ) : null}
                            {msg.text && !['Sent a voice message', 'Sent an audio clip', 'Sent an image', 'Sent a video', 'Sent a document'].includes(msg.text) ? <Text style={styles.messageTextReceived}>{msg.text}</Text> : null}
                            </View>
                            <Text style={styles.messageTime}>{formattedTime}</Text>
                          </View>
                        </Pressable>
                      )
                    })}
                  </View>
                ))
              )}
            </ScrollView>
          );
        })()}

        <View style={styles.inputAreaContainer}>
          {showAttachmentMenu && (
            <View style={styles.attachmentMenu}>
              <View style={styles.attachmentColumn}>
                <Pressable style={styles.attachmentOption} onPress={() => { setShowAttachmentMenu(false); handleAttachDocument(); }}>
                  <View style={[styles.attachmentIconBox, { backgroundColor: '#5F66CD' }]}>
                    <Ionicons name="document-text" size={24} color="#FFF" />
                  </View>
                  <Text style={styles.attachmentOptionText}>Document</Text>
                </Pressable>
                
                <Pressable style={styles.attachmentOption} onPress={() => { setShowAttachmentMenu(false); handleAttachVideo(); }}>
                  <View style={[styles.attachmentIconBox, { backgroundColor: '#E1306C' }]}>
                    <Ionicons name="videocam" size={24} color="#FFF" />
                  </View>
                  <Text style={styles.attachmentOptionText}>Video</Text>
                </Pressable>
                
                <Pressable style={styles.attachmentOption} onPress={() => { setShowAttachmentMenu(false); handleAttach(); }}>
                  <View style={[styles.attachmentIconBox, { backgroundColor: '#00A884' }]}>
                    <Ionicons name="image" size={24} color="#FFF" />
                  </View>
                  <Text style={styles.attachmentOptionText}>Gallery</Text>
                </Pressable>

                <Pressable style={styles.attachmentOption} onPress={() => { setShowAttachmentMenu(false); handleAttachAudio(); }}>
                  <View style={[styles.attachmentIconBox, { backgroundColor: '#E47B2E' }]}>
                    <Ionicons name="headset" size={24} color="#FFF" />
                  </View>
                  <Text style={styles.attachmentOptionText}>Audio</Text>
                </Pressable>
              </View>
            </View>
          )}

          <View style={styles.inputRow}>
            {isRecording ? (
              <View style={styles.recordingContainer}>
                <Pressable onPress={cancelRecording} style={styles.trashIcon}>
                  <Ionicons name="trash" size={24} color={colors.danger} />
                </Pressable>
                
                <View style={styles.recordingIndicator}>
                  <View style={styles.pulsingDot} />
                  <Text style={styles.recordingText}>{formatDuration(recordingDuration)}</Text>
                  {(() => {
                    return (
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginLeft: 16, height: 24, overflow: 'hidden' }}>
                        {meterings.map((val, i) => {
                          const volume = Math.min(1, Math.max(0, (val + 60) / 60));
                          return (
                            <View 
                              key={i} 
                              style={{
                                width: 3,
                                borderRadius: 1.5,
                                backgroundColor: colors.primary,
                                height: 4 + (20 * volume),
                              }}
                            />
                          )
                        })}
                      </View>
                    );
                  })()}
                </View>

                <Pressable style={styles.sendButton} onPress={stopRecordingAndSend}>
                  <Ionicons name="send" size={20} color="#FFF" />
                </Pressable>
              </View>
            ) : (
              <>
                <Pressable style={styles.attachButton} onPress={() => setShowAttachmentMenu(!showAttachmentMenu)}>
                  <Ionicons name="attach" size={24} color={colors.textSecondary} />
                </Pressable>
                
                <View style={styles.textInputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder={"Type your message..."}
                    placeholderTextColor={colors.textSecondary}
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                    blurOnSubmit={false}
                  />
                  <Pressable onPress={() => setIsEmojiPickerOpen(true)} style={styles.emojiIcon}>
                    <Ionicons name="happy-outline" size={20} color={colors.textSecondary} />
                  </Pressable>
                </View>
    
                {inputText.trim() ? (
                  <Pressable style={styles.sendButton} onPress={handleSend}>
                    <Ionicons name="send" size={20} color="#FFF" />
                  </Pressable>
                ) : (
                  <Pressable style={styles.sendButton} onPress={startRecording}>
                    <Ionicons name="mic" size={20} color="#FFF" />
                  </Pressable>
                )}
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      <EmojiPicker 
        open={isEmojiPickerOpen} 
        onClose={() => setIsEmojiPickerOpen(false)} 
        onEmojiSelected={(emojiObject) => {
          setInputText((prev) => prev + emojiObject.emoji);
        }}
      />
    
      <Modal transparent visible={showDeleteModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {canDeleteForEveryone && (
              <Pressable style={styles.modalButton} onPress={() => executeDelete(true)}>
                <Text style={styles.modalButtonTextDanger}>Delete for everyone</Text>
              </Pressable>
            )}
            <Pressable style={styles.modalButton} onPress={() => executeDelete(false)}>
              <Text style={styles.modalButtonTextDanger}>Delete for me</Text>
            </Pressable>
            <Pressable style={[styles.modalButton, { borderBottomWidth: 0 }]} onPress={() => setShowDeleteModal(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  doctorInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  doctorInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: spacing.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  onlineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    position: "absolute",
    bottom: 0,
    right: 14,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  smallOnlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  chatFeed: {
    flex: 1,
  },
  chatContent: {
    padding: spacing.md,
    gap: spacing.lg,
  },
  dateHeaderContainer: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  dateHeaderContainerSticky: {
    alignItems: "center",
    marginBottom: spacing.md,
    position: 'sticky',
    top: spacing.md,
    zIndex: 10,
  },
  dateHeaderText: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: colors.textSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageRowReceived: {
    alignItems: "flex-start",
    alignSelf: "flex-start",
    maxWidth: "85%",
  },
  messageBubbleReceived: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  messageTextReceived: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  messageRowSent: {
    alignItems: "flex-end",
    alignSelf: "flex-end",
    maxWidth: "85%",
  },
  messageBubbleSent: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 20,
    borderTopRightRadius: 4,
    marginBottom: 4,
  },
  messageTextSent: {
    fontSize: 15,
    color: "#FFF",
    lineHeight: 22,
  },
  messageTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    justifyContent: "flex-end",
  },
  messageTime: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  inputAreaContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    position: 'relative',
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  attachButton: {
    padding: 8,
    marginRight: 4,
  },
  textInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 15,
    color: colors.text,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  } as any,
  emojiIcon: {
    padding: 4,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentMenu: {
    position: 'absolute',
    bottom: 70,
    left: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
  },
  attachmentColumn: {
    flexDirection: 'column',
    gap: 16,
  },
  attachmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  attachmentIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentOptionText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 8,
  },
  trashIcon: {
    padding: 8,
  },
  recordingIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
    marginRight: 8,
    marginLeft: 8,
  },
  recordingText: {
    fontSize: 16,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
  },
  modalButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  modalButtonTextDanger: {
    fontSize: 16,
    color: colors.danger,
    fontWeight: '600',
  },
});
