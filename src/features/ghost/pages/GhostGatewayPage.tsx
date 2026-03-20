import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProfileFromSupabase } from "../ghostProfileService";

const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/weqweqwsdfsdf.png";

export default function GhostGatewayPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const localProfile = (() => {
      try { return !!localStorage.getItem("ghost_profile"); } catch { return false; }
    })();

    if (localProfile) {
      // Already have a local profile — go straight in
      navigate("/ghost/mode", { replace: true });
      return;
    }

    // No local profile — try to restore from Supabase using phone number
    const phone = (() => {
      try { return localStorage.getItem("ghost_phone") || ""; } catch { return ""; }
    })();

    if (!phone) {
      navigate("/ghost/setup", { replace: true });
      return;
    }

    loadProfileFromSupabase(phone)
      .then((profile) => {
        if (profile) {
          // Restore profile to localStorage from Supabase
          try {
            localStorage.setItem("ghost_profile", JSON.stringify(profile));
            if (profile.interest) localStorage.setItem("ghost_interest", profile.interest as string);
          } catch {}
          navigate("/ghost/mode", { replace: true });
        } else {
          navigate("/ghost/setup", { replace: true });
        }
      })
      .catch(() => {
        // Network/Supabase error — don't block returning users at setup
        navigate("/ghost/mode", { replace: true });
      })
      .finally(() => setChecking(false));
  }, [navigate]);

  if (!checking) return null;

  // Show a ghost logo spinner while checking Supabase
  return (
    <div style={{
      minHeight: "100dvh", background: "#050508",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 16,
    }}>
      <img
        src={GHOST_LOGO}
        alt="ghost"
        style={{
          width: 80, height: 80, objectFit: "contain",
          animation: "pulse 1.4s ease-in-out infinite",
          opacity: 0.8,
        }}
      />
      <style>{`@keyframes pulse { 0%,100%{opacity:0.4;transform:scale(0.95)} 50%{opacity:1;transform:scale(1.05)} }`}</style>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: 0 }}>Finding your ghost…</p>
    </div>
  );
}
