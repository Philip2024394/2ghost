// GhostProfileDetailOverlay — full-screen profile detail, opened from "About Me"
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { GhostProfile } from "../types/ghostTypes";

const GOLD = "#d4af37";
const GOLD_BORDER = "rgba(212,175,55,0.28)";

function toGhostId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = (h << 5) - h + id.charCodeAt(i); h |= 0; }
  return `GH-${Math.abs(h).toString(16).toUpperCase().padStart(6, "0").slice(0, 6)}`;
}

function Row({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(212,175,55,0.1)" }}>
      <span style={{ fontSize: 16, width: 24, textAlign: "center", flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 10, color: "rgba(212,175,55,0.7)", fontWeight: 700, minWidth: 76, flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      <span style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <p style={{ margin: "20px 0 2px", fontSize: 9, fontWeight: 800, color: GOLD, letterSpacing: "0.14em", textTransform: "uppercase", borderBottom: `1px solid ${GOLD_BORDER}`, paddingBottom: 6 }}>
      {title}
    </p>
  );
}

interface Props {
  profile: GhostProfile;
  onClose: () => void;
}

export default function GhostProfileDetailOverlay({ profile: p, onClose }: Props) {
  const contactLabel =
    p.contactPref === "video"   ? "Video call first" :
    p.contactPref === "chat"    ? "Chat / message first" :
    p.contactPref === "outside" ? "Meet outside first" : null;

  const verLabel =
    p.verificationStatus === "verified" ? "✅ Verified" :
    p.verificationStatus === "pending"  ? "⏳ Pending" :
    p.faceVerified                       ? "✅ Face verified" : null;

  return (
    <motion.div
      key="profile-detail"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "#080808",
        display: "flex", flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Header bar */}
      <div style={{ position: "relative", padding: "52px 20px 16px", flexShrink: 0, borderBottom: `1px solid ${GOLD_BORDER}` }}>
        {/* Close */}
        <button onClick={onClose}
          style={{ position: "absolute", top: 14, left: 14, width: 38, height: 38, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", touchAction: "manipulation" }}>
          ✕
        </button>

        {/* Verified badge */}
        {(p.isVerified || p.faceVerified || p.verificationStatus === "verified") && (
          <div style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", borderRadius: 20, padding: "4px 10px", fontSize: 10, fontWeight: 700, color: GOLD, border: `1px solid ${GOLD_BORDER}` }}>
            ✅ Verified
          </div>
        )}

        {/* Name row */}
        <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#fff" }}>{toGhostId(p.id)}</p>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
          {p.age} · {p.city}, {p.countryFlag} {p.country}
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: "4px 20px 48px" }}>

        {/* Bio */}
        {p.bio && (
          <>
            <SectionHead title="About" />
            <p style={{ margin: "10px 0 0", fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.65 }}>{p.bio}</p>
          </>
        )}

        {/* Identity */}
        <SectionHead title="Identity" />
        <Row icon="👤" label="Gender"   value={p.gender} />
        <Row icon="🎂" label="Age"      value={`${p.age} years old`} />
        <Row icon="📍" label="Location" value={`${p.city}, ${p.country}`} />
        {p.distanceKm !== undefined && (
          <Row icon="📏" label="Distance" value={p.distanceKm < 1 ? "Less than 1 km away" : `${Math.round(p.distanceKm)} km away`} />
        )}
        {verLabel && <Row icon="🛡️" label="Status" value={verLabel} />}

        {/* First Point of Contact */}
        <SectionHead title="First Point of Contact" />
        {contactLabel && <Row icon="📱" label="Prefers"  value={contactLabel} />}
        {p.connectPhone && <Row icon="📞" label="Phone"   value={p.connectPhone} />}
        {p.connectAlt   && <Row icon="💬" label="Platform" value={p.connectAlt} />}
        {!contactLabel && !p.connectPhone && !p.connectAlt && (
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>Not specified</p>
        )}

        {/* Preferences */}
        <SectionHead title="Preferences" />
        <Row icon="🙏" label="Religion"   value={p.religion} />
        <Row icon="💑" label="Date Idea"  value={p.firstDateIdea} />

        {/* Interests */}
        {p.interests && p.interests.length > 0 && (
          <>
            <SectionHead title="Interests" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, paddingTop: 8 }}>
              {p.interests.map((tag, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 600, color: GOLD, border: `1px solid ${GOLD_BORDER}`, borderRadius: 20, padding: "4px 12px" }}>
                  {tag}
                </span>
              ))}
            </div>
          </>
        )}

        {/* Games I Like */}
        <SectionHead title="Games I Like" />
        <div style={{ marginTop: 8, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(250,204,21,0.18)" }}>
          <div style={{ padding: "10px 14px 8px", background: "rgba(250,204,21,0.06)", borderBottom: "1px solid rgba(250,204,21,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: "rgba(250,204,21,0.9)" }}>Hotel Games Room</p>
              <p style={{ margin: "2px 0 0", fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>Connect 4 · Chat open at every level</p>
            </div>
            <Link to="/games" style={{ fontSize: 9, fontWeight: 800, color: "rgba(250,204,21,0.65)", textDecoration: "none", background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.22)", borderRadius: 8, padding: "4px 8px" }}>
              Enter →
            </Link>
          </div>
          <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.25)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 8 }}>
              {[
                [0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0],
                [0,0,0,1,0,0,0],
                [0,0,1,2,0,0,0],
                [0,1,2,1,2,0,0],
                [2,1,2,1,2,1,0],
              ].flat().map((cell, i) => (
                <div key={i} style={{
                  width: "100%", aspectRatio: "1", borderRadius: "50%",
                  background: cell === 0 ? "rgba(255,255,255,0.05)" : cell === 1 ? "rgba(212,175,55,0.85)" : "rgba(255,255,255,0.85)",
                  border: cell === 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }} />
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>Connect 4 · Place your disc to win</p>
          </div>
        </div>

        {/* Guest Info */}
        <SectionHead title="Guest Info" />
        <Row icon="🏷️" label="Guest Id"  value={toGhostId(p.id)} />
        {p.badge && <Row icon="🎖️" label="Badge"    value={p.badge} />}
        {p.isNewGuest && <Row icon="✨" label="Guest"    value="New arrival" />}
        {p.weeksSinceJoin !== undefined && (
          <Row icon="📅" label="Member" value={p.weeksSinceJoin < 1 ? "This week" : `${p.weeksSinceJoin} weeks`} />
        )}
        {p.matchScore !== undefined && (
          <Row icon="💫" label="Match"   value={`${p.matchScore}% compatibility`} />
        )}

        {/* My Bestie */}
        <SectionHead title="My Bestie" />
        <div style={{ paddingTop: 10, display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(212,175,55,0.1)" }}>
            <span style={{ fontSize: 16, width: 24, textAlign: "center", flexShrink: 0 }}>🤝</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontStyle: "italic" }}>This guest hasn't linked a bestie yet</span>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
