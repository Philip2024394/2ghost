import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}
function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

const REWARD_DAYS: Record<number, number> = { 1: 2, 7: 20, 14: 35, 30: 100 };

function computeStreak(): { count: number; coinsAwarded: number } {
  try {
    const last = localStorage.getItem("ghost_streak_last") || "";
    const storedCount = Number(localStorage.getItem("ghost_streak_count") || "0");
    const today = getToday();
    const yesterday = getYesterday();

    let count = storedCount;
    if (last === today) {
      // already updated today — no change
    } else if (last === yesterday) {
      count = storedCount + 1;
    } else {
      count = 1;
    }
    localStorage.setItem("ghost_streak_last", today);
    localStorage.setItem("ghost_streak_count", String(count));

    // Award coins for milestone days
    let coinsAwarded = 0;
    const rewardAmt = REWARD_DAYS[count];
    if (rewardAmt) {
      const rewardKey = `ghost_streak_rewarded_${count}`;
      if (!localStorage.getItem(rewardKey)) {
        localStorage.setItem(rewardKey, "1");
        const current = Number(localStorage.getItem("ghost_coins") || "0");
        localStorage.setItem("ghost_coins", String(current + rewardAmt));
        coinsAwarded = rewardAmt;
      }
    }
    return { count, coinsAwarded };
  } catch {
    return { count: 1, coinsAwarded: 0 };
  }
}

export default function GhostStreakBanner() {
  const [visible, setVisible] = useState(false);
  const [streak, setStreak] = useState(0);
  const [coinsAwarded, setCoinsAwarded] = useState(0);

  useEffect(() => {
    if (sessionStorage.getItem("ghost_streak_session_shown")) return;
    sessionStorage.setItem("ghost_streak_session_shown", "1");
    const { count, coinsAwarded: coins } = computeStreak();
    setStreak(count);
    setCoinsAwarded(coins);
    setVisible(true);
  }, []);

  const showFlameBadge = streak >= 7;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 340, damping: 26 }}
          style={{
            margin: "8px 14px 0",
            background: "rgba(255,100,0,0.08)",
            border: "1px solid rgba(255,100,0,0.3)",
            borderRadius: 14,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            position: "relative",
          }}
        >
          <motion.span
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            style={{ fontSize: 22, flexShrink: 0 }}
          >
            🔥
          </motion.span>
          <div style={{ flex: 1 }}>
            {coinsAwarded > 0 ? (
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#ff9933", lineHeight: 1.4 }}>
                Day {streak} streak! {coinsAwarded} coins earned 🪙
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#ff9933", lineHeight: 1.4 }}>
                {streak} day streak{showFlameBadge ? " 🔥 On fire!" : " — keep it up!"}
              </p>
            )}
            <p style={{ margin: "1px 0 0", fontSize: 9, color: "rgba(255,153,51,0.6)", fontWeight: 600 }}>
              {REWARD_DAYS[streak + 1]
                ? `Next reward: ${REWARD_DAYS[streak + 1]} coins on day ${streak + 1}`
                : "Check in daily for coin rewards"}
            </p>
          </div>
          {showFlameBadge && (
            <div style={{
              background: "rgba(255,100,0,0.18)", border: "1px solid rgba(255,100,0,0.4)",
              borderRadius: 8, padding: "3px 8px", fontSize: 9, fontWeight: 900, color: "#ff9933",
              flexShrink: 0,
            }}>
              🔥 STREAK
            </div>
          )}
          <button
            onClick={() => setVisible(false)}
            style={{
              position: "absolute", top: 6, right: 8,
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,153,51,0.5)", fontSize: 14, fontWeight: 700,
              lineHeight: 1, padding: "2px 4px",
            }}
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
