import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/weqweqwsdfsdf.png";

type VerifyStatus = "idle" | "camera" | "preview" | "verifying" | "done";

type Props = {
  onVerified: () => void;
  onClose: () => void;
};

export default function GhostFaceVerify({ onVerified, onClose }: Props) {
  const [status, setStatus]         = useState<VerifyStatus>("idle");
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
      });
      streamRef.current = stream;
      setStatus("camera");
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch {
      setError("Camera access denied. Please allow camera access in your browser settings.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const capture = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width  = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Centre-crop to square
    const sx = (video.videoWidth  - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    setCapturedUrl(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
    setStatus("preview");
  };

  const retake = () => {
    setCapturedUrl(null);
    startCamera();
  };

  const submitVerify = () => {
    setStatus("verifying");
    // Simulate face-matching API call (replace with real endpoint in production)
    setTimeout(() => {
      try {
        localStorage.setItem("ghost_face_verified", "1");
        const raw = localStorage.getItem("ghost_profile");
        if (raw) {
          const profile = JSON.parse(raw);
          profile.faceVerified = true;
          localStorage.setItem("ghost_profile", JSON.stringify(profile));
        }
      } catch {}
      setStatus("done");
      onVerified();
    }, 2200);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={handleClose}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480, background: "#0d0d0f",
          borderRadius: "24px 24px 0 0", padding: "28px 20px 48px",
          border: "1px solid rgba(74,222,128,0.12)", borderBottom: "none",
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)", margin: "0 auto 24px" }} />

        <AnimatePresence mode="wait">

          {/* ── Idle: intro screen ── */}
          {status === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ textAlign: "center" }}>
              <img src={GHOST_LOGO} alt="ghost" style={{ width: 52, height: 52, objectFit: "contain", marginBottom: 16 }} />
              <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>Face Verification</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 24px", lineHeight: 1.6 }}>
                A quick selfie confirms you're a real person — not a bot or catfish.
                Your photo is <strong style={{ color: "rgba(255,255,255,0.7)" }}>never stored</strong> and only used for a one-time check.
              </p>

              <div style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.12)", borderRadius: 14, padding: 16, marginBottom: 24, textAlign: "left" }}>
                {[
                  ["✅", "Face in good lighting"],
                  ["✅", "Look directly at the camera"],
                  ["❌", "No glasses, masks, or filters"],
                  ["❌", "No group photos"],
                ].map(([icon, text]) => (
                  <div key={text} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 14 }}>{icon}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{text}</span>
                  </div>
                ))}
              </div>

              {error && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 16 }}>{error}</p>}

              <button
                onClick={startCamera}
                style={{
                  width: "100%", height: 52, borderRadius: 50, border: "none",
                  background: "linear-gradient(135deg,#4ade80,#22c55e)",
                  color: "#000", fontSize: 15, fontWeight: 800, cursor: "pointer", marginBottom: 12,
                }}
              >
                📷 Open Camera
              </button>
              <button onClick={handleClose} style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 13, cursor: "pointer", padding: "6px 0" }}>
                Maybe later
              </button>
            </motion.div>
          )}

          {/* ── Camera live view ── */}
          {status === "camera" && (
            <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: 16 }}>
                Position your face inside the circle
              </p>
              <div style={{ position: "relative", width: "100%", maxWidth: 320, margin: "0 auto 20px", borderRadius: "50%", overflow: "hidden", aspectRatio: "1", border: "3px solid rgba(74,222,128,0.5)" }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
              </div>
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <button
                onClick={capture}
                style={{
                  width: "100%", height: 52, borderRadius: 50, border: "none",
                  background: "linear-gradient(135deg,#4ade80,#22c55e)",
                  color: "#000", fontSize: 15, fontWeight: 800, cursor: "pointer", marginBottom: 12,
                }}
              >
                📸 Take Selfie
              </button>
              <button onClick={handleClose} style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 13, cursor: "pointer", padding: "6px 0" }}>
                Cancel
              </button>
            </motion.div>
          )}

          {/* ── Preview captured photo ── */}
          {status === "preview" && capturedUrl && (
            <motion.div key="preview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ textAlign: "center" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 16 }}>
                Does this look good?
              </p>
              <div style={{ width: 220, height: 220, borderRadius: "50%", overflow: "hidden", margin: "0 auto 20px", border: "3px solid rgba(74,222,128,0.5)" }}>
                <img src={capturedUrl} alt="selfie" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <button
                onClick={submitVerify}
                style={{
                  width: "100%", height: 52, borderRadius: 50, border: "none",
                  background: "linear-gradient(135deg,#4ade80,#22c55e)",
                  color: "#000", fontSize: 15, fontWeight: 800, cursor: "pointer", marginBottom: 10,
                }}
              >
                ✅ Verify Me
              </button>
              <button onClick={retake} style={{ width: "100%", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 50, height: 44, color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Retake
              </button>
            </motion.div>
          )}

          {/* ── Verifying spinner ── */}
          {status === "verifying" && (
            <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: "center", padding: "20px 0" }}>
              <img src={GHOST_LOGO} alt="ghost" style={{ width: 52, height: 52, objectFit: "contain", marginBottom: 16, animation: "pulse 1.4s ease-in-out infinite" }} />
              <style>{`@keyframes pulse{0%,100%{opacity:0.4;transform:scale(0.95)}50%{opacity:1;transform:scale(1.05)}}`}</style>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>Checking…</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Matching face to your profile photo</p>
            </motion.div>
          )}

          {/* ── Done ── */}
          {status === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#4ade80", margin: "0 0 8px" }}>Verified!</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 28px", lineHeight: 1.5 }}>
                A verified badge now shows on your card — other members know you're real.
              </p>
              <button
                onClick={handleClose}
                style={{
                  width: "100%", height: 50, borderRadius: 50, border: "none",
                  background: "linear-gradient(135deg,#4ade80,#22c55e)",
                  color: "#000", fontSize: 14, fontWeight: 800, cursor: "pointer",
                }}
              >
                Back to Profile
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
