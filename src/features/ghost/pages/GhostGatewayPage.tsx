import { useState, useEffect, Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GhostMockFeedPage from "./GhostMockFeedPage";

const GhostModePage = lazy(() => import("./GhostModePage"));
const GhostSetupPage = lazy(() => import("./GhostSetupPage"));

/**
 * Stacks the real feed behind the mock feed.
 * On unlock: mock slides left with a slow reveal, exposing the real page underneath.
 * After animation: navigates cleanly so the URL is correct.
 *
 * Women bypass entirely — they go straight to setup/feed for free.
 */
export default function GhostGatewayPage() {
  const navigate = useNavigate();
  const [unlocking, setUnlocking] = useState(false);
  const [done, setDone] = useState(false);

  const hasProfile = (() => {
    try { return !!localStorage.getItem("ghost_profile"); } catch { return false; }
  })();

  // Women skip mock feed entirely
  useEffect(() => {
    try {
      if (localStorage.getItem("ghost_gender") === "Female") {
        navigate(hasProfile ? "/ghost" : "/ghost/setup", { replace: true });
      }
    } catch {}
  }, [navigate, hasProfile]);

  // After slide animation finishes, swap to a real route so URL is correct
  useEffect(() => {
    if (!done) return;
    navigate(hasProfile ? "/ghost" : "/ghost/setup", { replace: true });
  }, [done, hasProfile, navigate]);

  const handleUnlock = () => {
    setUnlocking(true);
    // Let the animation play fully before navigating
    setTimeout(() => setDone(true), 820);
  };

  return (
    <div style={{
      position: "relative", width: "100vw", height: "100dvh",
      overflow: "hidden", background: "#050508",
    }}>

      {/* ── Real page sits underneath — loads in background ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        <Suspense fallback={
          <div style={{
            width: "100%", height: "100%", background: "#050508",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 40 }}>👻</span>
          </div>
        }>
          {hasProfile ? <GhostModePage /> : <GhostSetupPage />}
        </Suspense>
      </div>

      {/* ── Mock feed slides left on top, revealing the real page ── */}
      <motion.div
        animate={{ x: unlocking ? "-100vw" : 0 }}
        transition={{
          type: "spring",
          stiffness: 55,   // low stiffness = slow, weighty slide
          damping: 18,
          mass: 1.2,
        }}
        style={{
          position: "absolute", inset: 0, zIndex: 2,
          willChange: "transform",
          boxShadow: unlocking ? "-12px 0 40px rgba(0,0,0,0.6)" : "none",
        }}
      >
        <GhostMockFeedPage onUnlock={handleUnlock} />
      </motion.div>

    </div>
  );
}
