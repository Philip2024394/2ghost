import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ghostSupabase } from "../ghostSupabase";
import type { GhostProfile } from "../types/ghostTypes";

const GALLERY_BG = "https://ik.imagekit.io/7grri5v7d/cccccccccsfsfsdfadsfasdf.png";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

// Deterministic room ID from two ghost IDs
function callRoomId(a: string, b: string) {
  return "ghostcall_" + [a, b].sort().join("__");
}

// Who sends the offer — lower sorted ID is always offerer
function amOfferer(myId: string, theirId: string) {
  return myId < theirId;
}

type CallState = "starting" | "waiting" | "connecting" | "active" | "ended" | "error";

export default function GhostVideoCall({
  matchProfile,
  myGhostId,
  onEnd,
}: {
  matchProfile: GhostProfile;
  myGhostId: string;
  onEnd: () => void;
}) {
  const [callState, setCallState] = useState<CallState>("starting");
  const [timer, setTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef          = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef     = useRef<ReturnType<typeof ghostSupabase.channel> | null>(null);
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const endedRef       = useRef(false);

  const roomId  = callRoomId(myGhostId, matchProfile.id);
  const offerer = amOfferer(myGhostId, matchProfile.id);
  const firstName = matchProfile.name.split(" ")[0];

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
  }, []);

  const doCleanup = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    if (channelRef.current) {
      ghostSupabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const endCall = useCallback((sendSignal = true) => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (sendSignal && channelRef.current) {
      channelRef.current.send({ type: "broadcast", event: "hangup", payload: {} }).catch(() => {});
    }
    doCleanup();
    setCallState("ended");
    setTimeout(onEnd, 1800);
  }, [doCleanup, onEnd]);

  useEffect(() => {
    let pc: RTCPeerConnection;

    async function init() {
      try {
        // 1. Get camera + mic
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          await localVideoRef.current.play().catch(() => {});
        }

        // 2. Create RTCPeerConnection
        pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        // 3. Remote stream → show in video element
        pc.ontrack = (e) => {
          if (remoteVideoRef.current && e.streams[0]) {
            remoteVideoRef.current.srcObject = e.streams[0];
            setCallState("active");
            startTimer();
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
            endCall(false);
          }
        };

        // 4. Supabase Realtime broadcast for signaling
        const ch = ghostSupabase.channel(roomId, { config: { broadcast: { self: false } } });
        channelRef.current = ch;

        ch.on("broadcast", { event: "offer" }, async ({ payload }: { payload: { sdp: RTCSessionDescriptionInit } }) => {
          if (offerer) return; // I'm offerer — I sent this
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ch.send({ type: "broadcast", event: "answer", payload: { sdp: answer } });
            setCallState("connecting");
          } catch {}
        });

        ch.on("broadcast", { event: "answer" }, async ({ payload }: { payload: { sdp: RTCSessionDescriptionInit } }) => {
          if (!offerer) return;
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            setCallState("connecting");
          } catch {}
        });

        ch.on("broadcast", { event: "ice" }, async ({ payload }: { payload: { candidate: RTCIceCandidateInit } }) => {
          try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)); } catch {}
        });

        ch.on("broadcast", { event: "hangup" }, () => endCall(false));

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            ch.send({ type: "broadcast", event: "ice", payload: { candidate: e.candidate.toJSON() } }).catch(() => {});
          }
        };

        ch.subscribe(async (status) => {
          if (status !== "SUBSCRIBED") return;
          setCallState("waiting");
          if (offerer) {
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              ch.send({ type: "broadcast", event: "offer", payload: { sdp: offer } });
            } catch {}
          }
        });

      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        setErrorMsg(msg.includes("Permission") || msg.includes("denied")
          ? "Camera access denied. Please allow camera and microphone in your browser settings."
          : "Could not start camera. Make sure no other app is using it.");
        setCallState("error");
      }
    }

    init();
    return () => doCleanup();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleMute() {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(m => !m);
  }

  function toggleCam() {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCamOff(c => !c);
  }

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ position: "fixed", inset: 0, zIndex: 900, background: "#000", fontFamily: "'Inter',system-ui,sans-serif" }}
    >
      {/* Gallery Room background — visible when no remote video yet */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${GALLERY_BG})`,
        backgroundSize: "cover", backgroundPosition: "center",
      }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />

      {/* Remote video — full screen, shown once connected */}
      <video
        ref={remoteVideoRef} autoPlay playsInline
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* Status overlays */}
      <AnimatePresence>
        {callState !== "active" && callState !== "ended" && (
          <motion.div
            key="status"
            initial={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}
          >
            <div style={{ position: "relative" }}>
              <img src={matchProfile.image} alt="" style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(74,222,128,0.6)" }} />
              {callState !== "error" && (
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "2px solid rgba(74,222,128,0.5)" }}
                />
              )}
            </div>
            <p style={{ color: "#fff", fontSize: 20, fontWeight: 900, margin: 0 }}>{firstName}</p>
            {callState === "starting"   && <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0 }}>Starting camera...</p>}
            {callState === "waiting"    && <p style={{ color: "rgba(74,222,128,0.8)", fontSize: 14, margin: 0 }}>Waiting for {firstName} to join...</p>}
            {callState === "connecting" && <p style={{ color: "rgba(74,222,128,0.8)", fontSize: 14, margin: 0 }}>Connecting...</p>}
            {callState === "error" && (
              <p style={{ color: "#f87171", fontSize: 13, margin: 0, textAlign: "center", padding: "0 40px", lineHeight: 1.6 }}>{errorMsg}</p>
            )}
            <div style={{ display: "flex", gap: 8, flexDirection: "column", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.05)", borderRadius: 20, padding: "6px 14px" }}>
                <span style={{ fontSize: 12 }}>🏨</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700, letterSpacing: "0.08em" }}>GHOST DATE · GALLERY ROOM</span>
              </div>
            </div>
            <button
              onClick={() => endCall(true)}
              style={{ marginTop: 8, height: 44, padding: "0 28px", borderRadius: 50, border: "none", background: "#ef4444", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
            >
              {callState === "error" ? "Close" : "Cancel Call"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ended overlay */}
      <AnimatePresence>
        {callState === "ended" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <div style={{ fontSize: 52 }}>👻</div>
            <p style={{ color: "#fff", fontSize: 20, fontWeight: 900, margin: 0 }}>Ghost Date Ended</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>{fmt(timer)} · Gallery Room with {firstName}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar — branding + timer */}
      {callState === "active" && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "max(16px,env(safe-area-inset-top,16px)) 18px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 14 }}>🏨</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.65)", letterSpacing: "0.1em" }}>GHOST DATE</span>
          </div>
          <motion.div
            animate={timer >= 270 ? { borderColor: ["rgba(251,191,36,0.4)", "rgba(251,191,36,0.9)", "rgba(251,191,36,0.4)"] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
            style={{ background: "rgba(0,0,0,0.55)", borderRadius: 20, padding: "5px 14px", border: `1px solid ${timer >= 270 ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.15)"}` }}
          >
            <span style={{ fontSize: 14, fontWeight: 900, color: timer >= 270 ? "#fbbf24" : "#fff", fontVariantNumeric: "tabular-nums" }}>{fmt(timer)}</span>
          </motion.div>
          {timer >= 270 && (
            <span style={{ fontSize: 10, color: "#fbbf24", fontWeight: 700 }}>30s left</span>
          )}
        </div>
      )}

      {/* Local video PiP */}
      <div style={{ position: "absolute", bottom: "calc(110px + env(safe-area-inset-bottom, 0px))", right: 16, width: 82, height: 116, borderRadius: 14, overflow: "hidden", border: "2px solid rgba(255,255,255,0.3)", zIndex: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
        <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
        {isCamOff && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 22 }}>📷</span>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      {(callState === "active" || callState === "waiting" || callState === "connecting") && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "18px 0 max(32px,env(safe-area-inset-bottom,32px))", display: "flex", alignItems: "center", justifyContent: "center", gap: 22, background: "linear-gradient(to top, rgba(0,0,0,0.82), transparent)", zIndex: 10 }}>
          <motion.button whileTap={{ scale: 0.88 }} onClick={toggleMute}
            style={{ width: 56, height: 56, borderRadius: "50%", border: "none", background: isMuted ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.14)", cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isMuted ? "🔇" : "🎙️"}
          </motion.button>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => endCall(true)}
            style={{ width: 70, height: 70, borderRadius: "50%", border: "none", background: "linear-gradient(135deg,#dc2626,#ef4444)", cursor: "pointer", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 28px rgba(239,68,68,0.45)" }}>
            📵
          </motion.button>
          <motion.button whileTap={{ scale: 0.88 }} onClick={toggleCam}
            style={{ width: 56, height: 56, borderRadius: "50%", border: "none", background: isCamOff ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.14)", cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isCamOff ? "🚫" : "📷"}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
