import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { SEA_COUNTRY_LIST } from "../types/ghostTypes";
import { activateIntlGhost, saveIntlCountries } from "../utils/ghostHelpers";

import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
// ── Country tab bar ───────────────────────────────────────────────────────────
export function CountryTabBar({ homeCode, homeName, homeFlag, activeCode, onChange }: {
  homeCode: string;
  homeName: string;
  homeFlag: string;
  activeCode: string | null; // null = home country
  onChange: (code: string | null) => void;
}) {
  const a = useGenderAccent();
  const others = SEA_COUNTRY_LIST.filter((c) => c.code !== homeCode);
  return (
    <div style={{
      display: "flex", overflowX: "auto", gap: 8, padding: "10px 14px",
      scrollbarWidth: "none",
    }}>
      {/* Home country tab */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange(null)}
        style={{
          flexShrink: 0, height: 34, borderRadius: 50, padding: "0 14px",
          background: activeCode === null ? a.glow(0.15) : "rgba(255,255,255,0.05)",
          border: activeCode === null ? `1px solid ${a.glow(0.5)}` : "1px solid rgba(255,255,255,0.1)",
          color: activeCode === null ? a.glow(0.95) : "rgba(255,255,255,0.6)",
          fontSize: 12, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
          display: "flex", alignItems: "center", gap: 6,
        }}
      >
        <span>{homeFlag}</span>
        <span>{homeName}</span>
      </motion.button>

      {/* Other SEA countries */}
      {others.map((c) => (
        <motion.button
          key={c.code}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(c.code)}
          style={{
            flexShrink: 0, height: 34, borderRadius: 50, padding: "0 14px",
            background: activeCode === c.code ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
            border: activeCode === c.code ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.08)",
            color: activeCode === c.code ? "#818cf8" : "rgba(255,255,255,0.5)",
            fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <span>{c.flag}</span>
          <span>{c.name}</span>
        </motion.button>
      ))}
    </div>
  );
}

// ── International Ghost paywall ───────────────────────────────────────────────
export default function InternationalGhostModal({ userCountryCode, isFemale, onActivate, onClose }: {
  userCountryCode: string;
  isFemale: boolean;
  onActivate: (countries: string[]) => void;
  onClose: () => void;
}) {
  const a = useGenderAccent();
  const { t } = useLanguage();
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const available = SEA_COUNTRY_LIST.filter((c) => c.code !== userCountryCode);

  const toggle = (code: string) => {
    setSelectedCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(0,0,0,0.88)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "rgba(4,6,16,0.98)", backdropFilter: "blur(40px)",
          borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(99,102,241,0.3)", borderBottom: "none",
          padding: "0 22px max(40px, env(safe-area-inset-bottom, 40px))",
          boxShadow: "0 -28px 80px rgba(0,0,0,0.8)",
        }}
      >
        <div style={{ height: 4, background: "linear-gradient(90deg, #4f46e5, #818cf8, #6366f1)", marginLeft: -22, marginRight: -22 }} />
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 6px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
        </div>

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🌍</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            {t("intl.title")}
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "0 0 4px", lineHeight: 1.55 }}>
            List your profile in other countries — appear in their local feed.
          </p>
          {isFemale ? (
            <div style={{ background: a.glow(0.1), border: `1px solid ${a.glow(0.25)}`, borderRadius: 10, padding: "8px 12px", marginTop: 10 }}>
              <p style={{ fontSize: 12, color: a.glow(0.9), margin: 0, fontWeight: 700 }}>
                {t("intl.freeForWomen")} 🎁
              </p>
            </div>
          ) : (
            <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 10, padding: "8px 12px", marginTop: 10 }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: "#818cf8", margin: 0 }}>{t("intl.perMonth")}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>List in up to 5 countries · cancel anytime</p>
            </div>
          )}
        </div>

        <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>
          Choose countries to list in
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {available.map((c) => {
            const selected = selectedCountries.includes(c.code);
            return (
              <motion.button
                key={c.code}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggle(c.code)}
                style={{
                  width: "100%", height: 52, borderRadius: 14, padding: "0 16px",
                  background: selected ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)",
                  border: selected ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.07)",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 28 }}>{c.flag}</span>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: selected ? "#818cf8" : "#fff", margin: 0 }}>{c.name}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>Local Ghost House · {c.flag} feed</p>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  background: selected ? "#6366f1" : "rgba(255,255,255,0.08)",
                  border: selected ? "none" : "1px solid rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {selected && <span style={{ fontSize: 12, color: "#fff", fontWeight: 900 }}>✓</span>}
                </div>
              </motion.button>
            );
          })}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={selectedCountries.length === 0}
          onClick={() => {
            if (selectedCountries.length === 0) return;
            if (!isFemale) activateIntlGhost();
            saveIntlCountries(selectedCountries);
            onActivate(selectedCountries);
          }}
          style={{
            width: "100%", height: 52, borderRadius: 50, border: "none",
            background: selectedCountries.length > 0
              ? "linear-gradient(135deg, #4f46e5, #6366f1, #818cf8)"
              : "rgba(255,255,255,0.06)",
            color: selectedCountries.length > 0 ? "#fff" : "rgba(255,255,255,0.2)",
            fontSize: 15, fontWeight: 900, cursor: selectedCountries.length > 0 ? "pointer" : "default",
            boxShadow: selectedCountries.length > 0 ? "0 6px 28px rgba(99,102,241,0.4)" : "none",
            marginBottom: 12,
          }}
        >
          {isFemale
            ? `List free in ${selectedCountries.length || "..."} ${selectedCountries.length === 1 ? "country" : "countries"} →`
            : `Pay $9.99 · List in ${selectedCountries.length || "..."} ${selectedCountries.length === 1 ? "country" : "countries"} →`}
        </motion.button>
        <button onClick={onClose} style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer", padding: "8px 0" }}>
          {t("match.later")}
        </button>
      </motion.div>
    </motion.div>
  );
}
