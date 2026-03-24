// ── Dev Panel ────────────────────────────────────────────────────────────────
// Floating dev panel for testing modes, access levels, and popup triggers.
// Extracted from GhostModePage to reduce file size and improve hot reload.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ButlerMessageKey } from "./GhostButlerMessage";

const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/weqweqwsdfsdf.png";

export type DevPanelProps = {
  isTonightMode: boolean; toggleTonight: () => void;
  isFlashActive: boolean; enterFlash: () => void; exitFlash: () => void;
  houseTier: "gold" | "suite" | null; setHouseTier: (t: "gold" | "suite" | null) => void;
  activate: (p: "ghost" | "bundle") => void; deactivate: () => void;
  onTriggerFlashMatch: () => void; onTriggerMatch: () => void; onTriggerInbound: () => void;
  onTriggerButler: (key: ButlerMessageKey) => void;
  onSimulateChatInvite: () => void;
};

export default function GhostDevPanel({
  isTonightMode, toggleTonight,
  isFlashActive, enterFlash, exitFlash,
  houseTier, setHouseTier,
  activate, deactivate,
  onTriggerFlashMatch, onTriggerMatch, onTriggerInbound,
  onTriggerButler, onSimulateChatInvite,
}: DevPanelProps) {
  const [open, setOpen] = useState(false);

  const DEMO_PROFILE = {
    photo: "https://i.pravatar.cc/400?img=33",
    name: "Dev Admin", age: 28, city: "Yogyakarta", country: "Indonesia",
    countryFlag: "🇮🇩", countryCode: "ID", gender: "Male",
    vibe: { key: "tonight", icon: "🌙", label: "Tonight" },
    outcome: { key: "casual", icon: "🤝", label: "Casual Connection", tag: "Casual" },
  };

  const setGender = (g: "Male" | "Female") => {
    try {
      localStorage.setItem("ghost_gender", g);
      localStorage.setItem("ghost_phone", "+628123456789");
      const profile = { ...DEMO_PROFILE, gender: g, name: g === "Female" ? "Devi Admin" : "Dev Admin" };
      localStorage.setItem("ghost_profile", JSON.stringify(profile));
    } catch {}
  };

  const grantAccess = (plan: "ghost" | "bundle") => {
    const until = Date.now() + 30 * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem("ghost_mode_until", String(until));
      localStorage.setItem("ghost_mode_plan", plan);
      localStorage.setItem("ghost_phone", "+628123456789");
      if (!localStorage.getItem("ghost_profile")) {
        localStorage.setItem("ghost_profile", JSON.stringify(DEMO_PROFILE));
      }
    } catch {}
    activate(plan);
  };

  const setHouseAndPersist = (tier: "gold" | "suite" | null) => {
    try {
      if (tier) localStorage.setItem("ghost_house_tier", tier);
      else localStorage.removeItem("ghost_house_tier");
    } catch {}
    setHouseTier(tier);
  };

  const unlockAll = () => {
    try {
      const until = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem("ghost_mode_until", String(until));
      localStorage.setItem("ghost_mode_plan", "bundle");
      localStorage.setItem("ghost_phone", "+628123456789");
      const fullProfile = { ...DEMO_PROFILE, gender: "Male", id: "dev00000-0000-0000-0000-000000000001", faceVerified: true, city: "Yogyakarta", country: "Indonesia", countryFlag: "🇮🇩" };
      localStorage.setItem("ghost_profile", JSON.stringify(fullProfile));
      localStorage.setItem("ghost_gender", "Male");
      localStorage.setItem("ghost_face_verified", "1");
      localStorage.setItem("ghost_house_tier", "gold");
      localStorage.setItem("ghost_referral_count", "3");
      localStorage.setItem("ghost_block_package", "10");
      localStorage.setItem("ghost_butler_yogyakarta_flowers", "1");
    } catch {}
    activate("bundle");
    setHouseAndPersist("gold");
    window.location.reload();
  };

  const resetAll = () => {
    const keys = ["ghost_mode_until","ghost_mode_plan","ghost_profile","ghost_gender","ghost_phone",
      "ghost_passed_ids","ghost_matches","ghost_tonight_until","ghost_flash_until",
      "ghost_boost_until","ghost_house_tier","ghost_blocked_numbers","ghost_block_package","ghost_block_until",
      "ghost_face_verified","ghost_referral_count","ghost_referral_reward"];
    keys.forEach((k) => { try { localStorage.removeItem(k); } catch {} });
    deactivate();
    window.location.reload();
  };

  const btnBase: React.CSSProperties = {
    flex: 1, minWidth: 0, height: 34, borderRadius: 9, border: "none",
    fontSize: 11, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
    transition: "all 0.15s",
  };
  const btn = (active: boolean): React.CSSProperties => ({
    ...btnBase,
    background: active ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.07)",
    color: active ? "#4ade80" : "rgba(255,255,255,0.6)",
    border: active ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(255,255,255,0.08)",
  });
  const actionBtn: React.CSSProperties = {
    ...btnBase,
    background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)",
    border: "1px solid rgba(255,255,255,0.1)",
  };
  const dangerBtn: React.CSSProperties = {
    ...btnBase,
    background: "rgba(239,68,68,0.12)", color: "rgba(248,113,113,0.9)",
    border: "1px solid rgba(239,68,68,0.2)",
  };
  const label: React.CSSProperties = {
    fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)",
    letterSpacing: "0.1em", textTransform: "uppercase",
    marginBottom: 5, display: "block",
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.94 }}
        style={{
          position: "fixed", bottom: 90, right: 14, zIndex: 9000,
          width: 48, height: 28, borderRadius: 8,
          background: open ? "rgba(74,222,128,0.2)" : "rgba(0,0,0,0.75)",
          border: open ? "1px solid rgba(74,222,128,0.5)" : "1px solid rgba(255,255,255,0.15)",
          color: open ? "#4ade80" : "rgba(255,255,255,0.5)",
          fontSize: 10, fontWeight: 900, cursor: "pointer",
          backdropFilter: "blur(12px)", letterSpacing: "0.06em",
        }}
      >
        DEV
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            style={{
              position: "fixed", bottom: 126, right: 14, zIndex: 8999,
              width: 280,
              background: "rgba(6,6,12,0.97)", backdropFilter: "blur(30px)",
              borderRadius: 16, border: "1px solid rgba(74,222,128,0.2)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
              overflow: "hidden",
            }}
          >
            <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80)" }} />
            <div style={{ padding: "12px 12px 14px", display: "flex", flexDirection: "column", gap: 12 }}>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: "#4ade80" }}>🛠 Dev Panel</span>
                <button onClick={resetAll} style={{ ...dangerBtn, flex: "none", width: "auto", padding: "0 10px", fontSize: 10 }}>
                  Reset All
                </button>
              </div>

              <div>
                <span style={label}>Profile Setup</span>
                <div style={{ display: "flex", gap: 5 }}>
                  <button style={actionBtn} onClick={() => { setGender("Male"); grantAccess("ghost"); }}>👨 Male</button>
                  <button style={actionBtn} onClick={() => { setGender("Female"); grantAccess("ghost"); }}>👩 Female</button>
                </div>
              </div>

              <div>
                <span style={label}>Access Level</span>
                <div style={{ display: "flex", gap: 5 }}>
                  <button style={actionBtn} onClick={() => grantAccess("ghost")}><img src={GHOST_LOGO} alt="" style={{ width: 36, height: 36, objectFit: "contain", verticalAlign: "middle", marginRight: 4 }} /> Ghost</button>
                  <button style={actionBtn} onClick={() => grantAccess("bundle")}>⭐ Bundle</button>
                  <button style={dangerBtn} onClick={() => deactivate()}>Revoke</button>
                </div>
              </div>

              <div>
                <span style={label}>Modes</span>
                <div style={{ display: "flex", gap: 5 }}>
                  <button style={btn(isTonightMode)} onClick={toggleTonight}>🌙 Tonight</button>
                  <button style={btn(isFlashActive)} onClick={isFlashActive ? exitFlash : enterFlash}>⚡ Flash</button>
                </div>
              </div>

              <div>
                <span style={label}>Ghost Vaults Badge</span>
                <div style={{ display: "flex", gap: 5 }}>
                  <button style={btn(houseTier === "suite")} onClick={() => setHouseAndPersist("suite")}>🏨 Ensuite</button>
                  <button style={btn(houseTier === "gold")} onClick={() => setHouseAndPersist("gold")}>🔑 Gold</button>
                  <button style={btn(!houseTier)} onClick={() => setHouseAndPersist(null)}>None</button>
                </div>
              </div>

              <div>
                <span style={label}>Trigger Popups</span>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  <button style={actionBtn} onClick={onTriggerFlashMatch}>⚡ Flash Match</button>
                  <button style={actionBtn} onClick={onTriggerMatch}>💚 Match</button>
                  <button style={actionBtn} onClick={onTriggerInbound}>👋 Inbound Like</button>
                  <button style={{ ...actionBtn, color: "#d4af37", border: "1px solid rgba(212,175,55,0.3)" }} onClick={onSimulateChatInvite}>📨 Chat Invite (B)</button>
                </div>
              </div>

              <div>
                <span style={label}>🎩 Butler Messages</span>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  <button style={actionBtn} onClick={() => onTriggerButler("match_interest")}>💌 Interest</button>
                  <button style={actionBtn} onClick={() => onTriggerButler("noshow_warning_1")}>⚠️ No-show 1</button>
                  <button style={actionBtn} onClick={() => onTriggerButler("noshow_warning_2")}>⚠️ No-show 2</button>
                  <button style={{ ...actionBtn, color: "rgba(248,113,113,0.9)", border: "1px solid rgba(239,68,68,0.25)" }} onClick={() => onTriggerButler("noshow_final")}>🚨 Final Strike</button>
                  <button style={actionBtn} onClick={() => onTriggerButler("match_expiry")}>⏳ Expiry</button>
                  <button style={{ ...actionBtn, color: "#d4af37", border: "1px solid rgba(212,175,55,0.3)" }} onClick={() => onTriggerButler("coin_shop")}>🪙 Coin Shop</button>
                  <button style={{ ...actionBtn, color: "rgba(248,113,113,0.9)", border: "1px solid rgba(239,68,68,0.25)" }} onClick={() => onTriggerButler("banned")}>🚪 Banned</button>
                  <button style={actionBtn} onClick={() => onTriggerButler("welcome_back")}>👋 Welcome Back</button>
                  <button style={actionBtn} onClick={() => onTriggerButler("profile_incomplete")}>📋 Profile</button>
                  <button style={actionBtn} onClick={() => onTriggerButler("gift_received")}>🎁 Gift</button>
                  <button style={actionBtn} onClick={() => onTriggerButler("late_reply")}>⏰ Late Reply</button>
                  <button style={{ ...actionBtn, color: "rgba(248,113,113,0.9)", border: "1px solid rgba(239,68,68,0.25)" }} onClick={() => onTriggerButler("spam_warning")}>📵 Spam</button>
                  <button style={{ ...actionBtn, color: "rgba(248,113,113,0.9)", border: "1px solid rgba(239,68,68,0.25)" }} onClick={() => onTriggerButler("content_warning")}>🔞 Content</button>
                  <button style={{ ...actionBtn, color: "#d4af37", border: "1px solid rgba(212,175,55,0.3)" }} onClick={() => onTriggerButler("floor_upgrade")}>🏨 Floor Up</button>
                </div>
              </div>

              <div>
                <span style={label}>Admin Shortcut</span>
                <button
                  style={{ ...btnBase, width: "100%", background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.4)", fontWeight: 900, fontSize: 12 }}
                  onClick={unlockAll}
                >
                  🔓 Unlock All Features
                </button>
              </div>

              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", margin: 0, textAlign: "center" }}>
                Dev panel — not visible in production
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
