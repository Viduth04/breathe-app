import React, { useEffect } from 'react';
import { View, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { colors } from '@/theme';

const AudioMessage = ({ audioUri, isSent = true }: { audioUri: string, isSent?: boolean }) => {
  // The player is created per message and released automatically on unmount / uri change.
  const player = useAudioPlayer({ uri: audioUri }, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);

  const isPlaying = status.playing;
  const position = (status.currentTime || 0) * 1000;
  const duration = (status.duration || 0) * 1000;

  const formatAudioTime = (ms: number) => {
    if (!ms || isNaN(ms)) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Rewind to the start once playback finishes so the next tap replays it.
  useEffect(() => {
    if (status.didJustFinish) {
      player.pause();
      player.seekTo(0).catch(() => {});
    }
  }, [status.didJustFinish, player]);

  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        player.pause();
      } else {
        if (duration > 0 && position >= duration - 50) {
          await player.seekTo(0);
        }
        player.play();
      }
    } catch (error) {
      console.error("Error playing audio", error);
    }
  };

  const waveform = [4, 6, 8, 12, 16, 20, 16, 12, 8, 6, 4, 6, 10, 14, 18, 22, 18, 14, 10, 6, 4, 8, 12, 16, 12, 8, 4, 6];
  const iconColor = isSent ? "#FFF" : colors.primary;
  const trackColor = isSent ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.15)";
  
  const displayTime = isPlaying && position > 0 ? formatAudioTime(position) : (duration > 0 ? formatAudioTime(duration) : "0:00");
  const progressPercent = duration > 0 ? Math.min((position / duration) * 100, 100) : 0;

  return (
    <View style={{ width: 230, marginVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Pressable onPress={handlePlayPause}>
        <Ionicons name={isPlaying ? "pause" : "play"} size={32} color={iconColor} />
      </Pressable>
      
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 24, position: 'relative' }}>
          {waveform.map((h, i) => (
             <View key={i} style={{ width: 3, height: h, backgroundColor: trackColor, borderRadius: 1.5 }} />
          ))}
          {/* Scrubber dot */}
          <View style={{ position: 'absolute', left: `${progressPercent}%`, marginLeft: -6, width: 12, height: 12, borderRadius: 6, backgroundColor: '#34B7F1' }} />
        </View>
        <Text style={{ fontSize: 11, color: isSent ? "rgba(255,255,255,0.8)" : colors.textSecondary, marginTop: 4 }}>
          {displayTime}
        </Text>
      </View>
    </View>
  );
}

export default AudioMessage;
