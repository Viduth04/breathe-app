const JITSI_DOMAIN = "meet.jit.si";

export function getJitsiRoomName(bookingId: string) {
  const roomId = bookingId.trim().replace(/^cal-/i, "").replace(/[^a-zA-Z0-9_-]/g, "-");
  const roomName = `breathe-session-${roomId}`;
  if (!roomId || roomName.length > 128) {
    throw new Error("This session is missing a valid booking ID.");
  }
  return roomName;
}

export function getJitsiMeetingUrl(roomName: string, displayName: string) {
  const hash = new URLSearchParams({
    "config.disableDeepLinking": "true",
    "config.prejoinPageEnabled": "false",
    "config.startWithAudioMuted": "false",
    "config.startWithVideoMuted": "false",
    "userInfo.displayName": displayName,
  });

  return `https://${JITSI_DOMAIN}/${encodeURIComponent(roomName)}#${hash.toString()}`;
}

export function createJitsiRoomHtml(roomName: string, displayName: string) {
  const options = JSON.stringify({ roomName, displayName }).replace(/</g, "\\u003c");
  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <style>html,body,#call{width:100%;height:100%;margin:0;background:#111827;overflow:hidden}</style>
</head>
<body>
  <div id="call"></div>
  <script>
    const options = ${options};
    const postToApp = (message, detail) => {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ message, detail }));
      }
    };
    let api;
    let connectionTimeout;
    const clearConnectionTimeout = () => {
      if (connectionTimeout) clearTimeout(connectionTimeout);
    };
    const fail = () => {
      clearConnectionTimeout();
      postToApp("error", "Could not connect to the video consultation. Check your connection and try again.");
      api && api.dispose();
    };
    const startCall = () => {
      if (!window.JitsiMeetExternalAPI) {
        fail();
        return;
      }
      try {
        api = new window.JitsiMeetExternalAPI("${JITSI_DOMAIN}", {
          roomName: options.roomName,
          parentNode: document.getElementById("call"),
          width: "100%",
          height: "100%",
          userInfo: { displayName: options.displayName },
          configOverwrite: {
            disableDeepLinking: true,
            prejoinPageEnabled: false,
            startWithAudioMuted: false,
            startWithVideoMuted: false
          }
        });
        postToApp("ready");
        api.addEventListener("videoConferenceJoined", () => {
          clearConnectionTimeout();
          postToApp("joined");
        });
        api.addEventListener("videoConferenceLeft", () => {
          clearConnectionTimeout();
          postToApp("left");
        });
        api.addEventListener("readyToClose", () => {
          clearConnectionTimeout();
          postToApp("left");
        });
        api.addEventListener("errorOccurred", fail);
        connectionTimeout = setTimeout(fail, 45000);
      } catch {
        fail();
      }
    };
    const script = document.createElement("script");
    script.src = "https://${JITSI_DOMAIN}/external_api.js";
    script.async = true;
    script.onload = startCall;
    script.onerror = fail;
    document.head.appendChild(script);
  </script>
</body>
</html>`;
}
