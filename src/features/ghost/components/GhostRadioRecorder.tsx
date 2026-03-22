import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";

const MAX_DURATION = 30; // seconds

type Props = {
  onSend: (blob: Blob, durationSecs: number) => void;
  onClose: () => void;
};

export default function GhostRadioRecorder({ onSend, onClose }: Props) {
  const a = useGenderAccent();
  const [phase,     setPhase]     = useState<"idle" | "recording" | "preview" | "denied">("idle");
  const [elapsed,   setElapsed]   = useState(0);
  const [blob,      setBlob]      = useState<Blob | null>(null);
  const [playing,   setPlaying]   = useState(false);
  const mediaRef    = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef    = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRef.current?.stop();
    audioRef.current?.pause();
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      mediaRef.current = rec;
      chunksRef.current = [];

      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const b = new Blob(chunksRef.current, { type: mime });
        setBlob(b);
        setPhase("preview");
        stream.getTracks().forEach(t => t.stop());
      };

      rec.start(100);
      setPhase("recording");
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed(e => {
          if (e + 1 >= MAX_DURATION) {
            stopRecording();
            return MAX_DURATION;
          }
          return e + 1;
        });
      }, 1000);
    } catch {
      setPhase("denied");
    }
  }

  function stopRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    mediaRef.current?.stop();
  }

  function playPreview() {
    if (!blob) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setPlaying(false); return; }
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play();
    setPlaying(true);
    audio.onended = () => { setPlaying(false); audioRef.current = null; URL.revokeObjectURL(url); };
  }

  function handleSend() {
    if (!blob) return;
    onSend(blob, elapsed);
  }

  const pct = (elapsed / MAX_DURATION) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(6,6,10,0.99)", borderRadius: "24px 24px 0 0", border: `1px solid ${a.glow(0.2)}`, borderBottom: "none", overflow: "hidden" }}
      >
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${a.accent}, transparent)` }} />
        <div style={{ padding: "18px 22px max(36px,env(safe-area-inset-bottom,36px))" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", margin: "0 auto 18px" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 22 }}>📻</span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff" }}>Ghost Radio</p>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Up to 30 seconds · anonymous voice note</p>
            </div>
          </div>

          {phase === "denied" && (
            <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎤</div>
              <p style={{ fontSize: 14, fontWeight: 900, color: "#fff", margin: "0 0 8px" }}>Microphone access required</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 20px", lineHeight: 1.6 }}>
                Please allow microphone access in your browser settings to send voice notes.
              </p>
              <button onClick={onClose} style={{ height: 44, padding: "0 24px", borderRadius: 12, border: `1px solid ${a.glow(0.3)}`, background: a.glow(0.08), color: a.accent, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                Got it
              </button>
            </div>
          )}

          {phase === "idle" && (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 24px", lineHeight: 1.6 }}>
                Hold the mic to record. Max 30 seconds. Your voice note will be sent anonymously to the floor.
              </p>
              <motion.button
                whileTap={{ scale: 0.92 }} onClick={startRecording}
                style={{ width: 72, height: 72, borderRadius: "50%", border: "none", background: a.gradient, color: "#fff", fontSize: 28, cursor: "pointer", boxShadow: `0 8px 28px ${a.glow(0.5)}`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              >
                🎤
              </motion.button>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 12 }}>Tap to record</p>
            </div>
          )}

          {phase === "recording" && (
            <div style={{ textAlign: "center" }}>
              {/* Waveform */}
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 3, height: 48, marginBottom: 16 }}>
                {Array.from({ length: 14 }).map((_, i) => (
                  <motion.div key={i}
                    animate={{ scaleY: [0.2, 0.9 + Math.random() * 0.1, 0.2], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.5 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.04 }}
                    style={{ width: 4, height: 40, background: a.accent, borderRadius: 2, transformOrigin: "bottom" }}
                  />
                ))}
              </div>
              {/* Progress ring */}
              <div style={{ position: "relative", width: 72, height: 72, margin: "0 auto 12px" }}>
                <svg width="72" height="72" style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
                  <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                  <motion.circle cx="36" cy="36" r="30" fill="none" stroke={a.accent} strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 30}`}
                    strokeDashoffset={`${2 * Math.PI * 30 * (1 - pct / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <motion.button
                  whileTap={{ scale: 0.92 }} onClick={stopRecording}
                  style={{ position: "absolute", inset: 8, borderRadius: "50%", border: "none", background: "#ef4444", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  ⏹
                </motion.button>
              </div>
              <p style={{ fontSize: 13, fontWeight: 900, color: "#fff", margin: 0 }}>{elapsed}s / {MAX_DURATION}s</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Tap ⏹ to stop</p>
            </div>
          )}

          {phase === "preview" && (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "0 0 20px", lineHeight: 1.55 }}>
                {elapsed}s voice note recorded. Preview before sending.
              </p>
              <div style={{ display: "flex", gap: 10, marginBottom: 20, justifyContent: "center" }}>
                <motion.button whileTap={{ scale: 0.92 }} onClick={playPreview}
                  style={{ width: 52, height: 52, borderRadius: "50%", border: `1px solid ${a.glow(0.35)}`, background: a.glow(0.1), cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {playing ? "⏸" : "▶️"}
                </motion.button>
                <motion.button whileTap={{ scale: 0.92 }} onClick={() => { setBlob(null); setPhase("idle"); setElapsed(0); }}
                  style={{ width: 52, height: 52, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  🗑️
                </motion.button>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSend}
                style={{ width: "100%", height: 52, borderRadius: 16, border: "none", background: a.gradient, color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: `0 8px 24px ${a.glow(0.35)}` }}
              >
                📻 Send Voice Note
              </motion.button>
              <button onClick={onClose} style={{ display: "block", margin: "10px auto 0", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 11, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
