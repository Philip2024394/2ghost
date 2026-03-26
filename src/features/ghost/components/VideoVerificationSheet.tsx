/**
 * VideoVerificationSheet — Selfie video verification for Ghost profiles.
 *
 * Flow:
 *  1. User opens sheet → sees instructions
 *  2. Taps "Start Recording" → camera activates, 5s countdown
 *  3. Video recorded → preview shown
 *  4. Taps "Submit" → uploads to Supabase Storage → sets verification_status = 'pending'
 *  5. Shows "Under Review" state — admin approves in dashboard
 *
 * OPTIONAL FEATURE: Does NOT gate any app functionality.
 * Verified badge is cosmetic only.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ghostSupabase } from "../ghostSupabase";

type VerifyStep = "intro" | "camera" | "preview" | "uploading" | "pending" | "error";

interface Props {
  ghostId: string;
  onClose: () => void;
  onVerified?: () => void; // called when submission succeeds
}

const RECORD_SECONDS = 5;

export default function VideoVerificationSheet({ ghostId, onClose, onVerified }: Props) {
  const [step, setStep]               = useState<VerifyStep>("intro");
  const [countdown, setCountdown]     = useState(RECORD_SECONDS);
  const [errorMsg, setErrorMsg]       = useState("");
  const [blobUrl, setBlobUrl]         = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const videoRef    = useRef<HTMLVideoElement>(null);
  const previewRef  = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<BlobPart[]>([]);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const startCamera = useCallback(async () => {
    setStep("camera");
    setCountdown(RECORD_SECONDS);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      // Auto-start recording
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm") ? "video/webm" : "video/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url  = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setBlobUrl(url);
        setStep("preview");
        streamRef.current?.getTracks().forEach(t => t.stop());
      };
      recorder.start();

      // Countdown
      let remaining = RECORD_SECONDS;
      timerRef.current = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(timerRef.current!);
          recorder.stop();
        }
      }, 1000);
    } catch {
      setErrorMsg("Camera access denied. Please allow camera permission and try again.");
      setStep("error");
    }
  }, []);

  const retake = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setRecordedBlob(null);
    startCamera();
  };

  const submit = async () => {
    if (!recordedBlob) return;
    setStep("uploading");
    try {
      const ext      = recordedBlob.type.includes("mp4") ? "mp4" : "webm";
      const fileName = `verify/${ghostId}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await ghostSupabase.storage
        .from("ghost-videos")
        .upload(fileName, recordedBlob, { contentType: recordedBlob.type, upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = ghostSupabase.storage.from("ghost-videos").getPublicUrl(fileName);
      const videoUrl = urlData.publicUrl;

      // Update profile: set verification_status = pending and store video URL
      const { error: updateErr } = await ghostSupabase
        .from("ghost_profiles")
        .update({ verification_status: "pending", verification_video_url: videoUrl })
        .eq("ghost_id", ghostId);
      if (updateErr) throw updateErr;

      // Update localStorage so UI reflects pending state immediately
      try {
        const stored = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
        stored.verification_status = "pending";
        localStorage.setItem("ghost_profile", JSON.stringify(stored));
      } catch {}

      setStep("pending");
      onVerified?.();
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Upload failed. Please try again.");
      setStep("error");
    }
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="vv-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      />

      {/* Sheet */}
      <motion.div
        key="vv-sheet"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        onClick={e => e.stopPropagation()}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10000,
          maxWidth: 480, margin: "0 auto",
          background: "#07060a",
          borderRadius: "22px 22px 0 0",
          border: "1px solid rgba(212,175,55,0.2)",
          borderBottom: "none",
          maxHeight: "92dvh",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Gold bar */}
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          style={{ height: 3, flexShrink: 0, background: "linear-gradient(90deg,#92660a,#d4af37,#f0d060,#d4af37,#92660a)", borderRadius: "3px 3px 0 0" }}
        />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px", flexShrink: 0, borderBottom: "1px solid rgba(212,175,55,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              🎥
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff" }}>Video Verification</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(74,222,128,0.7)", fontWeight: 600 }}>Get your Verified badge — free, optional</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px max(28px,env(safe-area-inset-bottom,28px))" }}>

          {/* ── INTRO ── */}
          {step === "intro" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>✦</div>
                <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: "0 0 8px" }}>Become a Verified Ghost</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, margin: 0 }}>
                  A quick 5-second selfie video confirms you're real. You'll receive a green verified badge visible to all guests — boosting your match score.
                </p>
              </div>

              {[
                { icon: "📹", text: "Record a 5-second front-facing selfie video" },
                { icon: "🔒", text: "Video is reviewed privately by our team — never shared" },
                { icon: "✓", text: "Verified badge appears on your card within 24 hours" },
                { icon: "🎯", text: "Verified profiles rank higher in the feed" },
              ].map(item => (
                <div key={item.icon} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{item.text}</p>
                </div>
              ))}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={startCamera}
                style={{ width: "100%", height: 52, borderRadius: 16, border: "none", background: "linear-gradient(135deg,#1a6b3a,#22c55e)", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", marginTop: 20, letterSpacing: "0.02em" }}
              >
                Start Verification
              </motion.button>
              <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 12 }}>
                This is optional — you can still use 2Ghost without verifying.
              </p>
            </motion.div>
          )}

          {/* ── CAMERA ── */}
          {step === "camera" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center" }}>
              <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", background: "#000", marginBottom: 20, aspectRatio: "3/4" }}>
                <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
                {/* Countdown overlay */}
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  <motion.div
                    key={countdown}
                    initial={{ scale: 1.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ fontSize: 72, fontWeight: 900, color: countdown <= 2 ? "#f87171" : "#fff", textShadow: "0 0 20px rgba(0,0,0,0.8)" }}
                  >
                    {countdown}
                  </motion.div>
                </div>
                {/* Recording indicator */}
                <div style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.65)", borderRadius: 20, padding: "4px 10px" }}>
                  <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} style={{ width: 8, height: 8, borderRadius: "50%", background: "#f87171" }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>REC</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0 }}>
                Look naturally at the camera — recording automatically stops
              </p>
            </motion.div>
          )}

          {/* ── PREVIEW ── */}
          {step === "preview" && blobUrl && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ borderRadius: 18, overflow: "hidden", background: "#000", marginBottom: 20, aspectRatio: "3/4" }}>
                <video ref={previewRef} src={blobUrl} autoPlay loop muted playsInline controls={false}
                  style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", textAlign: "center", margin: "0 0 20px" }}>
                Happy with this? 👇
              </p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={submit}
                style={{ width: "100%", height: 52, borderRadius: 16, border: "none", background: "linear-gradient(135deg,#92660a,#d4af37)", color: "#000", fontSize: 15, fontWeight: 900, cursor: "pointer", marginBottom: 12 }}
              >
                Submit for Verification
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={retake}
                style={{ width: "100%", height: 44, borderRadius: 14, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Retake
              </motion.button>
            </motion.div>
          )}

          {/* ── UPLOADING ── */}
          {step === "uploading" && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid rgba(212,175,55,0.15)", borderTop: "3px solid #d4af37", margin: "0 auto 20px" }}
              />
              <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>Uploading your video…</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>Securely encrypted — please wait</p>
            </div>
          )}

          {/* ── PENDING ── */}
          {step === "pending" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🕐</div>
              <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 10px" }}>Under Review</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, margin: "0 0 28px" }}>
                Your video has been submitted. Our team will review it within 24 hours and your Verified badge will appear automatically.
              </p>
              <div style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 16, padding: "14px 18px", textAlign: "left", marginBottom: 24 }}>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(74,222,128,0.85)", lineHeight: 1.7 }}>
                  ✓ Video received securely<br />
                  ✓ Reviewed privately — never shown to other guests<br />
                  ✓ Badge granted once approved
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                style={{ width: "100%", height: 50, borderRadius: 16, border: "none", background: "linear-gradient(135deg,#92660a,#d4af37)", color: "#000", fontSize: 14, fontWeight: 900, cursor: "pointer" }}
              >
                Back to Hotel
              </motion.button>
            </motion.div>
          )}

          {/* ── ERROR ── */}
          {step === "error" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>⚠️</div>
              <p style={{ fontSize: 15, fontWeight: 800, color: "#f87171", margin: "0 0 8px" }}>Something went wrong</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 28px", lineHeight: 1.7 }}>{errorMsg}</p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep("intro")}
                style={{ width: "100%", height: 50, borderRadius: 16, border: "none", background: "linear-gradient(135deg,#92660a,#d4af37)", color: "#000", fontSize: 14, fontWeight: 900, cursor: "pointer" }}
              >
                Try Again
              </motion.button>
            </motion.div>
          )}

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
