import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { onValue, push, ref, remove, set } from "firebase/database";
import { rtdb } from "@/firebase/config";

type ConsultationVideoRoomProps = {
  bookingId: string;
  displayName: string;
};

type Role = "counselor" | "student";
type SignalDescription = {
  type: RTCSdpType;
  sdp: string;
};

const iceServers: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

function getRole(displayName: string): Role {
  return displayName.toLowerCase().includes("counsellor") ||
    displayName.toLowerCase().includes("counselor")
    ? "counselor"
    : "student";
}

export default function ConsultationVideoRoom({
  bookingId,
  displayName,
}: ConsultationVideoRoomProps) {
  const role = useMemo(() => getRole(displayName), [displayName]);
  const remoteRole: Role = role === "counselor" ? "student" : "counselor";
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const seenCandidatesRef = useRef<Set<string>>(new Set());
  const [status, setStatus] = useState("Starting secure video room...");
  const [error, setError] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [remoteConnected, setRemoteConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cleanups: (() => void)[] = [];

    async function startWebRtcRoom() {
      if (!bookingId) {
        setError("This session is missing a valid booking ID.");
        return;
      }
      if (!rtdb) {
        setError("Realtime video signaling is not configured.");
        return;
      }

      try {
        setError("");
        setStatus("Requesting camera and microphone...");

        const localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        if (cancelled) {
          localStream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = localStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        const remoteStream = new MediaStream();
        remoteStreamRef.current = remoteStream;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }

        const peer = new RTCPeerConnection(iceServers);
        peerRef.current = peer;
        localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));

        peer.ontrack = (event) => {
          event.streams[0]?.getTracks().forEach((track) => {
            const currentRemote = remoteStreamRef.current;
            if (currentRemote && !currentRemote.getTracks().some((item) => item.id === track.id)) {
              currentRemote.addTrack(track);
            }
          });
          setRemoteConnected(true);
          setStatus("Connected");
        };

        peer.onconnectionstatechange = () => {
          if (peer.connectionState === "connected") {
            setRemoteConnected(true);
            setStatus("Connected");
          } else if (peer.connectionState === "failed") {
            setError("The peer connection failed. Refresh both call screens and try again.");
          } else if (peer.connectionState === "disconnected") {
            setStatus("Waiting for the other person to reconnect...");
          }
        };

        peer.onicecandidate = (event) => {
          if (!event.candidate) return;
          push(ref(rtdb, `calls/${bookingId}/webrtc/${role}Candidates`), event.candidate.toJSON())
            .catch(() => {
              setError("Could not send video connection data.");
            });
        };

        cleanups.push(
          onValue(ref(rtdb, `calls/${bookingId}/webrtc/${remoteRole}Candidates`), (snapshot) => {
            const values = snapshot.val();
            if (!values) return;

            Object.entries(values as Record<string, RTCIceCandidateInit>).forEach(([key, value]) => {
              if (seenCandidatesRef.current.has(key)) return;
              seenCandidatesRef.current.add(key);
              peer.addIceCandidate(new RTCIceCandidate(value)).catch(() => {});
            });
          }),
        );

        if (role === "counselor") {
          setStatus("Starting meeting room...");
          await remove(ref(rtdb, `calls/${bookingId}/webrtc`));

          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          await set(ref(rtdb, `calls/${bookingId}/webrtc/offer`), {
            type: offer.type,
            sdp: offer.sdp,
          });

          cleanups.push(
            onValue(ref(rtdb, `calls/${bookingId}/webrtc/answer`), async (snapshot) => {
              const answer = snapshot.val() as SignalDescription | null;
              if (!answer || peer.currentRemoteDescription) return;
              await peer.setRemoteDescription(new RTCSessionDescription(answer));
              setStatus("Waiting for student video...");
            }),
          );
          setStatus("Meeting started. Waiting for student...");
        } else {
          setStatus("Joining meeting room...");
          cleanups.push(
            onValue(ref(rtdb, `calls/${bookingId}/webrtc/offer`), async (snapshot) => {
              const offer = snapshot.val() as SignalDescription | null;
              if (!offer || peer.currentRemoteDescription) return;

              await peer.setRemoteDescription(new RTCSessionDescription(offer));
              const answer = await peer.createAnswer();
              await peer.setLocalDescription(answer);
              await set(ref(rtdb, `calls/${bookingId}/webrtc/answer`), {
                type: answer.type,
                sdp: answer.sdp,
              });
              setStatus("Connecting to counsellor...");
            }),
          );
        }
      } catch (reason) {
        const message = reason instanceof Error ? reason.message : "Could not start video call.";
        setError(message);
      }
    }

    startWebRtcRoom();

    return () => {
      cancelled = true;
      cleanups.forEach((cleanup) => cleanup());
      peerRef.current?.close();
      peerRef.current = null;
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      remoteStreamRef.current = null;
    };
  }, [bookingId, remoteRole, role]);

  const toggleMic = () => {
    const next = !micOn;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    setMicOn(next);
  };

  const toggleCamera = () => {
    const next = !camOn;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    setCamOn(next);
  };

  return (
    <View style={styles.container}>
      {React.createElement("video", {
        ref: remoteVideoRef,
        autoPlay: true,
        playsInline: true,
        style: styles.remoteVideo,
      })}

      {!remoteConnected ? (
        <View pointerEvents="none" style={styles.waitingOverlay}>
          {error ? null : <ActivityIndicator color="#FFFFFF" />}
          <Text style={error ? styles.errorText : styles.statusText}>
            {error || status}
          </Text>
        </View>
      ) : null}

      <View style={styles.selfView}>
        {React.createElement("video", {
          ref: localVideoRef,
          autoPlay: true,
          muted: true,
          playsInline: true,
          style: styles.localVideo,
        })}
        <Text style={styles.selfLabel}>{displayName}</Text>
      </View>

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          onPress={toggleMic}
          style={[styles.controlButton, !micOn && styles.controlButtonOff]}
        >
          <Text style={styles.controlText}>{micOn ? "Mic On" : "Mic Off"}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={toggleCamera}
          style={[styles.controlButton, !camOn && styles.controlButtonOff]}
        >
          <Text style={styles.controlText}>{camOn ? "Camera On" : "Camera Off"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#111827",
  },
  remoteVideo: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    backgroundColor: "#111827",
  },
  waitingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    backgroundColor: "#111827",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  selfView: {
    position: "absolute",
    right: 14,
    bottom: 78,
    width: 140,
    height: 178,
    borderRadius: 16,
    overflow: "hidden",
    borderColor: "rgba(255,255,255,0.35)",
    borderWidth: 2,
    backgroundColor: "#0F172A",
  },
  localVideo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  selfLabel: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  controls: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  controlButton: {
    borderRadius: 999,
    backgroundColor: "rgba(4, 120, 87, 0.92)",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  controlButtonOff: {
    backgroundColor: "rgba(220, 38, 38, 0.92)",
  },
  controlText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
