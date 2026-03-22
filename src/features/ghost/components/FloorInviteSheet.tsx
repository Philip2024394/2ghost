import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import type { GhostProfile } from "../types/ghostTypes";

// ── Types ──────────────────────────────────────────────────────────────────────
export type AcceptedMember = {
  profileId: string;
  profileName: string;
  profileImage: string;
  invitedByName: string;
  floor: string;
  joinedAt: number;
  nudgeSentAt: number | null;
};

// ── Storage helpers ────────────────────────────────────────────────────────────
export function getAcceptedFloorMembers(): AcceptedMember[] {
  try { return JSON.parse(localStorage.getItem("ghost_floor_accepted") || "[]"); } catch { return []; }
}
function saveAcceptedMember(m: AcceptedMember) {
  const all = getAcceptedFloorMembers().filter(x => x.profileId !== m.profileId);
  try { localStorage.setItem("ghost_floor_accepted", JSON.stringify([...all, m])); } catch {}
}
export function isProfileInvited(profileId: string): AcceptedMember | null {
  return getAcceptedFloorMembers().find(m => m.profileId === profileId) ?? null;
}
export function markNudgeSent(profileId: string) {
  const all = getAcceptedFloorMembers().map(m =>
    m.profileId === profileId ? { ...m, nudgeSentAt: Date.now() } : m
  );
  try { localStorage.setItem("ghost_floor_accepted", JSON.stringify(all)); } catch {}
}

// ── Floor config ───────────────────────────────────────────────────────────────
export const FLOOR_LABELS: Record<string, string> = {
  standard: "Standard Room", suite: "Ghost Suite", kings: "Kings Room",
  penthouse: "Penthouse", cellar: "The Cellar", garden: "Garden Lodge",
};
export const FLOOR_FEES: Record<string, string> = {
  standard: "4.99", suite: "8.99", kings: "11.99", penthouse: "19.99", cellar: "14.99", garden: "14.99",
};
const FLOOR_EMOJI: Record<string, string> = {
  standard: "🏠", suite: "🏨", kings: "👑", penthouse: "🌆", cellar: "🍷", garden: "🌿",
};

// ── Deterministic floor for fake profiles ─────────────────────────────────────
const FLOOR_ORDER = ["standard", "suite", "kings", "penthouse", "cellar"] as const;
export function getProfileFloor(profileId: string): string {
  const hash = profileId.split("").reduce((h, c) => Math.imul(31, h) + c.charCodeAt(0) | 0, 0);
  return FLOOR_ORDER[Math.abs(hash) % FLOOR_ORDER.length];
}
export function floorRank(floor: string): number {
  return FLOOR_ORDER.indexOf(floor as typeof FLOOR_ORDER[number]);
}

// ── Props ──────────────────────────────────────────────────────────────────────
type Props = {
  profile: GhostProfile;
  targetFloor: string;       // floor being invited to (current user's floor for "invite", profile's floor for "request")
  mode: "invite" | "request";
  onClose: () => void;
  onSuccess: (member: AcceptedMember) => void;
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function FloorInviteSheet({ profile, targetFloor, mode, onClose, onSuccess }: Props) {
  const a = useGenderAccent();
  const [step, setStep] = useState<"confirm" | "waiting" | "accepted">("confirm");

  const userName = (() => {
    try { return JSON.parse(localStorage.getItem("ghost_profile") || "{}").name || "Ghost"; } catch { return "Ghost"; }
  })();

  const floorLabel = FLOOR_LABELS[targetFloor] ?? targetFloor;
  const fee        = FLOOR_FEES[targetFloor]  ?? "9.99";
  const floorEmoji = FLOOR_EMOJI[targetFloor] ?? "🏨";
  const firstName  = profile.name.split(" ")[0];

  const inviterName = mode === "invite" ? userName : firstName;
  const perks = mode === "invite"
    ? [
        `${firstName}'s profile will carry "Invited by ${userName}"`,
        "Direct message opens immediately — no match required",
        "Your profiles are exclusive floor connections",
        "Butler will formally introduce you both",
      ]
    : [
        `Your profile will carry "Invited by ${firstName}"`,
        "Direct message opens immediately — no match required",
        "You're featured as their personal guest on the floor",
        "Butler will announce your arrival to the floor",
      ];

  // Simulate accept after payment
  useEffect(() => {
    if (step !== "waiting") return;
    const t = setTimeout(() => {
      const member: AcceptedMember = {
        profileId:    profile.id,
        profileName:  profile.name,
        profileImage: profile.image,
        invitedByName: inviterName,
        floor:        targetFloor,
        joinedAt:     Date.now(),
        nudgeSentAt:  null,
      };
      saveAcceptedMember(member);
      setStep("accepted");
      setTimeout(() => onSuccess(member), 1800);
    }, 3500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 560, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(6,6,10,0.99)", borderRadius: "24px 24px 0 0", border: `1px solid ${a.glow(0.22)}`, borderBottom: "none", overflow: "hidden" }}
      >
        {/* Top stripe */}
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${a.accent}, transparent)` }} />

        <div style={{ padding: "20px 20px max(28px,env(safe-area-inset-bottom,28px))" }}>

          {/* ── CONFIRM step ── */}
          {step === "confirm" && (
            <>
              {/* Profile row */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <img
                  src={profile.image} alt={profile.name}
                  style={{ width: 62, height: 62, borderRadius: "50%", objectFit: "cover", border: `2px solid ${a.glow(0.45)}`, flexShrink: 0 }}
                  onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                />
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#fff" }}>{profile.name}{profile.age ? `, ${profile.age}` : ""}</p>
                  {profile.city && <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>📍 {profile.city}</p>}
                  <p style={{ margin: "4px 0 0", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)" }}>
                    {getProfileFloor(profile.id).charAt(0).toUpperCase() + getProfileFloor(profile.id).slice(1)} member
                  </p>
                </div>
              </div>

              {/* Floor card */}
              <div style={{ background: a.glow(0.08), border: `1px solid ${a.glow(0.22)}`, borderRadius: 16, padding: "14px 16px", marginBottom: 16 }}>
                <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: a.glow(0.55), textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {mode === "invite" ? "Inviting to your floor" : "Requesting access to their floor"}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 26 }}>{floorEmoji}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: a.accent }}>{floorLabel}</p>
                    <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Monthly membership · USD</p>
                  </div>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#fff" }}>
                    ${fee}<span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>/mo</span>
                  </p>
                </div>
              </div>

              {/* Context */}
              <p style={{ margin: "0 0 14px", fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>
                {mode === "invite"
                  ? <>You're sponsoring <strong style={{ color: "#fff" }}>{firstName}</strong>'s access. Once they accept, their card will carry <em style={{ color: a.accent }}>Invited by {userName}</em> — visible to the entire floor.</>
                  : <>You're asking <strong style={{ color: "#fff" }}>{firstName}</strong> to bring you to their floor. If they accept, your profile will carry <em style={{ color: a.accent }}>Invited by {firstName}</em> — a mark of their personal endorsement.</>
                }
              </p>

              {/* Perks */}
              <div style={{ marginBottom: 18 }}>
                {perks.map(p => (
                  <div key={p} style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 7 }}>
                    <span style={{ color: a.accent, fontSize: 11, flexShrink: 0, marginTop: 2 }}>✓</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{p}</span>
                  </div>
                ))}
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 16 }} />

              {/* CTA */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep("waiting")}
                style={{ width: "100%", height: 52, borderRadius: 16, border: "none", background: a.gradient, color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", marginBottom: 10, boxShadow: `0 8px 24px ${a.glow(0.35)}` }}
              >
                {mode === "invite" ? `Send Invite · $${fee}/mo` : `Send Request · $${fee}/mo`}
              </motion.button>
              <button
                onClick={onClose}
                style={{ width: "100%", height: 44, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Not now
              </button>
            </>
          )}

          {/* ── WAITING step ── */}
          {step === "waiting" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "28px 0" }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                style={{ width: 50, height: 50, borderRadius: "50%", border: `3px solid ${a.glow(0.12)}`, borderTop: `3px solid ${a.accent}` }}
              />
              <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#fff" }}>
                {mode === "invite" ? "Sending invitation…" : "Sending request…"}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 1.6 }}>
                {mode === "invite"
                  ? `Waiting for ${firstName} to accept your invitation`
                  : `Waiting for ${firstName} to respond to your request`
                }
              </p>
            </div>
          )}

          {/* ── ACCEPTED step ── */}
          {step === "accepted" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "24px 0" }}>
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 20 }}
                style={{ width: 66, height: 66, borderRadius: "50%", background: a.glow(0.14), border: `2px solid ${a.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}
              >
                ✓
              </motion.div>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: a.accent }}>
                {mode === "invite" ? `${firstName} accepted!` : "Request accepted!"}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.7, maxWidth: 280 }}>
                {mode === "invite"
                  ? `${firstName} has joined your floor. Their profile now carries "Invited by ${userName}". Say hello — a gift is the perfect first impression.`
                  : `You've been added to ${firstName}'s floor. Your profile now shows "Invited by ${firstName}". Don't keep them waiting.`
                }
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Butler Nudge Sheet ─────────────────────────────────────────────────────────
export function FloorNudgeSheet({ member, onClose }: { member: AcceptedMember; onClose: () => void }) {
  const firstName = member.profileName.split(" ")[0];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 560, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(6,6,10,0.99)", borderRadius: "24px 24px 0 0", border: "1px solid rgba(251,191,36,0.2)", borderBottom: "none", overflow: "hidden" }}
      >
        <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #fbbf24, transparent)" }} />
        <div style={{ padding: "24px 22px max(28px,env(safe-area-inset-bottom,28px))", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
          <motion.span
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ fontSize: 40 }}
          >🎩</motion.span>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.12em" }}>Butler Notice</p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#fff", lineHeight: 1.4 }}>
            {firstName} has settled in quietly
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, maxWidth: 300 }}>
            The Butler has noticed that <strong style={{ color: "rgba(255,255,255,0.85)" }}>{firstName}</strong> appears to be finding their footing — sitting back and taking in the atmosphere. A well-placed gift has been known to open doors. Perhaps send one and see what comes back?
          </p>
          <img
            src={member.profileImage} alt={member.profileName}
            style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(251,191,36,0.4)" }}
            onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
          />
          <button
            onClick={onClose}
            style={{ width: "100%", height: 50, borderRadius: 16, border: "none", background: "linear-gradient(135deg,#92400e,#d4af37)", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", maxWidth: 320 }}
          >
            Send a Gift 🎁
          </button>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer", padding: "4px 0" }}
          >
            Maybe later
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
