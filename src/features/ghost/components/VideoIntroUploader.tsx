import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import {
  hasVideoIntro, getVideoIntroUrl, setVideoIntroUrl,
  isVideoPrivate, setVideoPrivate, getVideoRequestsReceived,
} from "../utils/featureGating";
import { saveVideoIntroToSupabase, loadVideoRequestsReceived as loadVideoRequestsFromSupabase, updateVideoRequestStatus, getMyGhostId } from "../ghostDataService";

type Props = { onClose: () => void };

export default function VideoIntroUploader({ onClose }: Props) {
  const a = useGenderAccent();
  const fileRef = useRef<HTMLInputElement>(null);
  const [hasVideo, setHasVideo]       = useState(hasVideoIntro);
  const [videoUrl, setVideoUrl]       = useState<string | null>(getVideoIntroUrl);
  const [isPrivate, setIsPrivate]     = useState(isVideoPrivate);
  const [uploading, setUploading]     = useState(false);
  const [progress, setProgress]       = useState(0);
  const [phase, setPhase]             = useState<"main" | "requests">("main");

  const [received, setReceived] = useState(getVideoRequestsReceived);
  const pendingCount = received.filter(r => r.status === "pending").length;

  // Load video requests from Supabase on mount
  useEffect(() => {
    const myId = getMyGhostId();
    if (!myId) return;
    loadVideoRequestsFromSupabase(myId).then(rows => {
      if (rows.length === 0) return;
      // Map Supabase shape → VideoRequest shape
      setReceived(rows.map(r => ({
        id: `vr-${r.fromGhostId}`,
        fromGhostId: r.fromGhostId,
        toProfileId: myId,
        status: r.status as "pending" | "approved" | "denied",
        requestedAt: new Date(r.requestedAt).getTime(),
        coinsSpent: r.coinsSpent,
      })));
    });
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { alert("Max 50MB video"); return; }
    const url = URL.createObjectURL(file);
    setUploading(true);
    setProgress(0);
    // Simulate upload progress
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 5;
      if (p >= 100) {
        clearInterval(iv);
        setProgress(100);
        setTimeout(() => {
          setVideoIntroUrl(url);
          setVideoUrl(url);
          setHasVideo(true);
          setUploading(false);
          saveVideoIntroToSupabase(getMyGhostId(), url, isPrivate);
        }, 400);
      } else {
        setProgress(Math.round(p));
      }
    }, 150);
  }

  function handleDelete() {
    try { localStorage.removeItem("ghost_video_intro_url"); } catch {}
    setVideoUrl(null);
    setHasVideo(false);
  }

  function togglePrivacy() {
    const next = !isPrivate;
    setVideoPrivate(next);
    setIsPrivate(next);
    saveVideoIntroToSupabase(getMyGhostId(), videoUrl || "", next);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 650, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(6,6,10,0.99)", borderRadius: "24px 24px 0 0", border: `1px solid ${a.glow(0.2)}`, borderBottom: "none", maxHeight: "93dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${a.accent}, transparent)` }} />

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          {[
            { key: "main",     label: "My Video Intro" },
            { key: "requests", label: `Requests ${pendingCount > 0 ? `(${pendingCount})` : ""}` },
          ].map(tab => (
            <button key={tab.key} onClick={() => setPhase(tab.key as "main" | "requests")}
              style={{ flex: 1, height: 44, background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 800, color: phase === tab.key ? a.accent : "rgba(255,255,255,0.35)", borderBottom: phase === tab.key ? `2px solid ${a.accent}` : "2px solid transparent", transition: "all 0.15s" }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px max(36px,env(safe-area-inset-bottom,36px))", scrollbarWidth: "none" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", margin: "0 auto 18px" }} />

          {phase === "main" && (
            <>
              <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 900, color: "#fff" }}>Video Introduction</p>
              <p style={{ margin: "0 0 20px", fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                A short introduction video that other ghosts can <strong style={{ color: "#fff" }}>request to view</strong>. You decide who sees it — every request needs your approval.
              </p>

              {/* Video preview or upload CTA */}
              {uploading ? (
                <div style={{ width: "100%", height: 160, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: `1px solid ${a.glow(0.15)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 20 }}>
                  <span style={{ fontSize: 28 }}>📤</span>
                  <div style={{ width: "70%", height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                    <motion.div style={{ height: "100%", background: a.accent, borderRadius: 2 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.2 }} />
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Uploading… {progress}%</p>
                </div>
              ) : hasVideo && videoUrl ? (
                <div style={{ position: "relative", width: "100%", height: 160, borderRadius: 16, overflow: "hidden", marginBottom: 20, border: `1px solid ${a.glow(0.25)}` }}>
                  <video src={videoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 32 }}>▶️</span>
                  </div>
                  <button onClick={handleDelete}
                    style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(239,68,68,0.8)", border: "none", cursor: "pointer", color: "#fff", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >✕</button>
                  <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.7)", borderRadius: 8, padding: "3px 8px" }}>
                    <span style={{ fontSize: 10, color: "#4ade80", fontWeight: 800 }}>✓ Uploaded</span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{ width: "100%", height: 160, borderRadius: 16, background: `${a.glow(0.04)}`, border: `2px dashed ${a.glow(0.3)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20, cursor: "pointer" }}
                >
                  <span style={{ fontSize: 36 }}>🎬</span>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: a.accent }}>Upload Video Introduction</p>
                  <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Max 30s · MP4 or MOV · Under 50MB</p>
                </div>
              )}

              <input ref={fileRef} type="file" accept="video/*" onChange={handleFile} style={{ display: "none" }} />

              {/* Privacy toggle */}
              {hasVideo && (
                <>
                  <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 10px" }}>Privacy control</p>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={togglePrivacy}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.03)", border: `1px solid ${isPrivate ? a.glow(0.3) : "rgba(255,255,255,0.1)"}`, borderRadius: 14, padding: "12px 16px", cursor: "pointer", marginBottom: 14, transition: "all 0.15s" }}
                  >
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{isPrivate ? "🔒" : "🔓"}</span>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>
                        {isPrivate ? "Request required" : "Visible to all"}
                      </p>
                      <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                        {isPrivate ? "Ghosts must spend 5 coins to request — you approve each one" : "Anyone can view your intro without requesting"}
                      </p>
                    </div>
                    <div style={{ width: 36, height: 20, borderRadius: 10, background: isPrivate ? a.accent : "rgba(255,255,255,0.12)", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
                      <div style={{ position: "absolute", top: 3, left: isPrivate ? 18 : 3, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                    </div>
                  </motion.button>
                </>
              )}

              {!hasVideo && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => fileRef.current?.click()}
                  style={{ width: "100%", height: 52, borderRadius: 16, border: "none", background: a.gradient, color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: `0 8px 24px ${a.glow(0.3)}` }}
                >
                  🎬 Upload My Video Intro
                </motion.button>
              )}

              <div style={{ marginTop: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 12px" }}>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                  🔐 Videos are stored privately and only playable inside the Ghost Vault. They cannot be screenshotted, downloaded, or shared outside the House.
                </p>
              </div>
            </>
          )}

          {phase === "requests" && (
            <>
              <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 900, color: "#fff" }}>Video Requests</p>
              <p style={{ margin: "0 0 18px", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                Ghosts who want to view your intro. You control access.
              </p>
              {received.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                  <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.3)" }}>No requests yet</p>
                  <p style={{ margin: "8px 0 0", fontSize: 10, color: "rgba(255,255,255,0.2)" }}>Upload a video intro to start receiving them</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {received.map(req => (
                    <div key={req.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: `${a.glow(0.1)}`, border: `1px solid ${a.glow(0.25)}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>👻</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#fff" }}>{req.fromGhostId}</p>
                        <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                          {new Date(req.requestedAt).toLocaleDateString()} · {req.coinsSpent} coins spent
                        </p>
                      </div>
                      {req.status === "pending" ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => {
                            updateVideoRequestStatus(req.fromGhostId, getMyGhostId(), "approved");
                            setReceived(prev => prev.map(r => r.id === req.id ? { ...r, status: "approved" as const } : r));
                          }} style={{ height: 32, padding: "0 12px", borderRadius: 8, border: "none", background: "#4ade80", color: "#000", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>Approve</button>
                          <button onClick={() => {
                            updateVideoRequestStatus(req.fromGhostId, getMyGhostId(), "denied");
                            setReceived(prev => prev.map(r => r.id === req.id ? { ...r, status: "denied" as const } : r));
                          }} style={{ height: 32, padding: "0 10px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Deny</button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 800, color: req.status === "approved" ? "#4ade80" : "#f87171", background: req.status === "approved" ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${req.status === "approved" ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 6, padding: "3px 8px" }}>
                          {req.status === "approved" ? "✓ Approved" : "✗ Denied"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
