import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const MR_BUTLAS_IMG = "https://ik.imagekit.io/7grri5v7d/sfsadfasdf.png?updatedAt=1774389915762";

export default function GhostWelcomePage() {
  const navigate = useNavigate();

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#000",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      fontFamily: "'Georgia', serif",
    }}>
      {/* Full-screen background image */}
      <img
        src={MR_BUTLAS_IMG}
        alt="Mr. Butlas"
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          objectPosition: "center center",
          display: "block",
        }}
      />

      {/* Dark gradient overlay — light at top, strong at bottom */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.10) 40%, rgba(0,0,0,0.72) 75%, rgba(0,0,0,0.92) 100%)",
      }} />

      {/* Top-left headline */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          position: "absolute",
          top: "max(44px, env(safe-area-inset-top, 44px))",
          left: 24,
          zIndex: 10,
        }}
      >
        <p style={{
          margin: 0,
          fontSize: 24,
          fontWeight: 800,
          color: "#fff",
          letterSpacing: "0.01em",
          lineHeight: 1.15,
          textShadow: "0 2px 24px rgba(0,0,0,0.9)",
          fontFamily: "'Georgia', serif",
        }}>
          Find Your
        </p>
        <p style={{
          margin: 0,
          fontSize: 24,
          fontWeight: 800,
          color: "#fff",
          letterSpacing: "0.01em",
          lineHeight: 1.15,
          textShadow: "0 2px 24px rgba(0,0,0,0.9)",
          fontFamily: "'Georgia', serif",
        }}>
          Perfect Match
        </p>
      </motion.div>

      {/* "with..." centered under the headline */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          position: "absolute",
          top: "calc(max(44px, env(safe-area-inset-top, 44px)) + 68px)",
          left: 0, right: 0,
          textAlign: "center",
          zIndex: 10,
        }}
      >
        <p style={{
          margin: 0,
          fontSize: 34,
          fontWeight: 400,
          fontStyle: "italic",
          color: "#fff",
          textShadow: "0 0 10px rgba(220,30,30,0.9), 0 0 24px rgba(200,0,0,0.6), 0 0 40px rgba(180,0,0,0.35)",
          fontFamily: "'Georgia', serif",
          letterSpacing: "0.02em",
        }}>
          with...
        </p>
      </motion.div>

      {/* Bottom CTA area */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          position: "absolute",
          bottom: "max(48px, env(safe-area-inset-bottom, 48px))",
          left: 24, right: 24,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <button
          onClick={() => navigate("/ghost")}
          style={{
            width: "100%",
            maxWidth: 400,
            height: 58,
            borderRadius: 50,
            border: "none",
            background: "linear-gradient(to bottom, #ff3b3b 0%, #e01010 40%, #b80000 100%)",
            color: "#fff",
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: "0.06em",
            cursor: "pointer",
            textTransform: "uppercase",
            boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 32px rgba(220,20,20,0.55), 0 2px 8px rgba(0,0,0,0.5)",
            fontFamily: "'Georgia', serif",
          }}
        >
          Find Now
        </button>
        <a
          href="/affiliate/join"
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            letterSpacing: "0.04em",
            fontFamily: "'Georgia', serif",
          }}
        >
          Become an Affiliate
        </a>
      </motion.div>
    </div>
  );
}
