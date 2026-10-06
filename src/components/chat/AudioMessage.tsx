import React, { useState, useEffect } from 'react';
import { View, Pressable, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Safe dynamic fallback for Expo Go where ExponentAV native binary is absent
let Audio: any = null;
try {
  Audio = require('expo-av')?.Audio;
} catch (_) {}
import { colors } from '@/theme';

const AudioMessage = ({ audioUri, isSent = true }: { audioUri: string, isSent?: boolean }) => {
  const [sound, setSound] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const formatAudioTime = (ms: number) => {
    if (!ms || isNaN(ms)) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let isMounted = true;
    
    const prefetchDuration = async () => {
      try {
        if (!Audio?.Sound) return;
        if (Platform.OS === 'web') {
          const webAudio = new window.Audio(audioUri);
          webAudio.addEventListener('loadedmetadata', () => {
            if (isMounted && webAudio.duration && webAudio.duration !== Infinity) {
              setDuration(Math.floor(webAudio.duration * 1000));
            }
          });
        }
        
        const { sound: tempSound, status } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: false }
        );
        if (isMounted && status.isLoaded && status.durationMillis) {
          setDuration(status.durationMillis);
        }
        if (isMounted) {
          setSound(tempSound);
          tempSound.setOnPlaybackStatusUpdate((stat: any) => {
            if (stat.isLoaded) {
              setPosition(stat.positionMillis);
              if (stat.durationMillis) setDuration(stat.durationMillis);
              if (stat.didJustFinish) {
                setIsPlaying(false);
                tempSound.setPositionAsync(0);
                setPosition(0);
              }
            }
          });
        } else {
          tempSound.unloadAsync();
        }
      } catch (e) {
        console.warn("Audio prefetch error:", e);
      }
    };
    
    prefetchDuration();

    return () => {
      isMounted = false;
    };
  }, [audioUri]);

  // Handle unload on unmount
  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  const handlePlayPause = async () => {
    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            if (status.positionMillis === status.durationMillis) {
              await sound.setPositionAsync(0);
            }
            await sound.playAsync();
            setIsPlaying(true);
          }
        }
      }
    } catch (error) {
      console.error("Error playing audio", error);
      setIsPlaying(false);
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
