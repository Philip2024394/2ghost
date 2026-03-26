// TableArrivalSequence — full-screen cinematic experience shown when a guest
// arrives at their assigned breakfast table via a chef invite.
// Phases: flash (5s) → countdown (5→1) → "Chat Activated" → onComplete()
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LOUNGE_BG = "https://ik.imagekit.io/7grri5v7d/mmmmmdfgdsfgdfg.png";

// Simplified visible floor — first 9 tables shown on arrival pan
const VISIBLE_TABLES = [
  { id: "T-01", x: 10,  y: 12  },
  { id: "T-02", x: 34,  y: 10  },
  { id: "T-03", x: 62,  y: 13  },
  { id: "T-04", x: 88,  y: 11  },
  { id: "T-07", x: 10,  y: 40  },
  { id: "T-08", x: 36,  y: 38  },
  { id: "T-09", x: 62,  y: 42  },
  { id: "T-10", x: 88,  y: 39  },
  { id: "T-13", x: 22,  y: 68  },
  { id: "T-14", x: 52,  y: 70  },
  { id: "T-15", x: 78,  y: 67  },
];

// Assign a table deterministically from a profile id seed
export function assignTable(profileId: string): string {
  let h = 0;
  for (let i = 0; i < profileId.length; i++) h = Math.imul(37, h) + profileId.charCodeAt(i) | 0;
  return VISIBLE_TABLES[Math.abs(h) % VISIBLE_TABLES.length].id;
}

type Phase = "flash" | "countdown" | "activated";

interface Props {
  assignedTableId: string;
  onComplete: () => void;
}

export default function TableArrivalSequence({ assignedTableId, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("flash");
  const [count, setCount] = useState(5);
  const [flashOn, setFlashOn] = useState(true);

  // Flash pulse — toggle every 500ms
  useEffect(() => {
    if (phase !== "flash") return;
    const t = setInterval(() => setFlashOn(p => !p), 500);
    return () => clearInterval(t);
  }, [phase]);

  // After 5.5s of flashing, move to countdown
  useEffect(() => {
    if (phase !== "flash") return;
    const t = setTimeout(() => setPhase("countdown"), 5500);
    return () => clearTimeout(t);
  }, [phase]);

  // Countdown 5→1, then "activated"
  useEffect(() => {
    if (phase !== "countdown") return;
    const t = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          clearInterval(t);
          setPhase("activated");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  // After "activated" display, call onComplete
  useEffect(() => {
    if (phase !== "activated") return;
    const t = setTimeout(onComplete, 1800);
    return () => clearTimeout(t);
  }, [phase, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 950,
        backgroundImage: `url(${LOUNGE_BG})`,
        backgroundSize: "cover", backgroundPosition: "center",
        overflow: "hidden",
      }}
    >
      {/* Dark overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(4,2,3,0.72)",
      }} />

      {/* Floor tables */}
      <div style={{ position: "absolute", inset: 0 }}>
        {VISIBLE_TABLES.map(table => {
          const isAssigned = table.id === assignedTableId;
          const tableColor = isAssigned
            ? (flashOn ? "#e01010" : "rgba(220,20,20,0.3)")
            : "rgba(255,255,255,0.15)";
          const glowColor = isAssigned && flashOn
            ? "0 0 28px rgba(220,20,20,0.8), 0 0 60px rgba(220,20,20,0.4)"
            : "none";

          return (
            <div
              key={table.id}
              style={{
                position: "absolute",
                left: `${table.x}%`,
                top: `${table.y}%`,
                transform: "translate(-50%, -50%)",
                width: 52, height: 52,
                borderRadius: "50%",
                background: tableColor,
                border: `2px solid ${isAssigned ? (flashOn ? "#ff3030" : "rgba(220,20,20,0.4)") : "rgba(255,255,255,0.2)"}`,
                boxShadow: glowColor,
                transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <span style={{
                fontSize: 9, fontWeight: 900,
                color: isAssigned ? (flashOn ? "#fff" : "rgba(255,80,80,0.7)") : "rgba(255,255,255,0.3)",
                letterSpacing: "0.04em",
              }}>
                {table.id}
              </span>
              {/* Seat dots */}
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  position: "absolute",
                  width: 10, height: 10, borderRadius: "50%",
                  background: isAssigned ? (flashOn ? "rgba(255,255,255,0.9)" : "rgba(255,80,80,0.4)") : "rgba(255,255,255,0.12)",
                  border: `1px solid ${isAssigned ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.1)"}`,
                  top: i === 0 ? -7 : i === 1 ? "50%" : undefined,
                  bottom: i === 2 ? -7 : undefined,
                  left: i === 0 ? "50%" : i === 1 ? -7 : "50%",
                  transform: i === 0 ? "translateX(-50%)" : i === 1 ? "translateY(-50%)" : "translateX(-50%)",
                  transition: "background 0.2s",
                }} />
              ))}
            </div>
          );
        })}
      </div>

      {/* Header label */}
      <div style={{
        position: "absolute", top: 28, left: 0, right: 0,
        textAlign: "center",
      }}>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: "rgba(212,175,55,0.8)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          Breakfast Lounge
        </p>
        {phase === "flash" && (
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}
          >
            Your table is being prepared…
          </motion.p>
        )}
      </div>

      {/* Assigned table label — bottom */}
      {phase === "flash" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: "absolute", bottom: 80, left: 0, right: 0,
            textAlign: "center",
          }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(220,20,20,0.15)",
            border: "1px solid rgba(220,20,20,0.4)",
            borderRadius: 20, padding: "8px 20px",
          }}>
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: "50%", background: "#e01010" }}
            />
            <span style={{ fontSize: 12, fontWeight: 900, color: "rgba(255,255,255,0.8)" }}>
              Table {assignedTableId} — reserved for you
            </span>
          </div>
        </motion.div>
      )}

      {/* Countdown overlay */}
      <AnimatePresence>
        {phase === "countdown" && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              background: "rgba(4,2,3,0.6)",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={count}
                initial={{ scale: 1.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.35 }}
                style={{
                  margin: 0,
                  fontSize: 120, fontWeight: 900,
                  color: "#fff",
                  lineHeight: 1,
                  textShadow: "0 0 60px rgba(220,20,20,0.6), 0 0 20px rgba(220,20,20,0.4)",
                }}
              >
                {count}
              </motion.p>
            </AnimatePresence>
            <p style={{ margin: "16px 0 0", fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.12em" }}>
              CONNECTING TO TABLE {assignedTableId}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Activated overlay */}
      <AnimatePresence>
        {phase === "activated" && (
          <motion.div
            key="activated"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              background: "rgba(4,2,3,0.7)",
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "linear-gradient(135deg, #b80000, #e01010)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 20,
                boxShadow: "0 0 40px rgba(220,20,20,0.5)",
              }}
            >
              <span style={{ fontSize: 30 }}>💬</span>
            </motion.div>
            <p style={{
              margin: 0, fontSize: 28, fontWeight: 900, color: "#fff",
              letterSpacing: "0.06em",
              textShadow: "0 0 30px rgba(220,20,20,0.5)",
            }}>
              Chat Activated
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              Table {assignedTableId} is now live
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
