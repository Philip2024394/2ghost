import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { hasApplied, saveApplication } from "../utils/penthouseHelpers";
import type { PenthouseReligion, PenthouseStayType, PenthouseChildren } from "../types/penthouseTypes";

const RELIGIONS: PenthouseReligion[] = ["Muslim","Christian","Catholic","Hindu","Buddhist","Other","Prefer not to say"];
const STAY_TYPES: PenthouseStayType[] = ["Hotel guest","Local resident","Just visiting"];

export default function PenthouseApplyPage() {
  const navigate   = useNavigate();
  const [applied]  = useState(hasApplied);
  const [step, setStep]       = useState(0);
  const [name, setName]       = useState("");
  const [age, setAge]         = useState("");
  const [city, setCity]       = useState("");
  const [bio, setBio]         = useState("");
  const [religion, setReligion] = useState<PenthouseReligion | "">("");
  const [stayType, setStayType] = useState<PenthouseStayType | "">("");
  const [children, setChildren] = useState<PenthouseChildren | "">("");
  const [instagram, setInstagram] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const steps = [
    { title: "Your basics", valid: name.trim().length >= 2 && age.trim().length > 0 && city.trim().length >= 2 },
    { title: "Your story", valid: bio.trim().length >= 40 && religion !== "" && stayType !== "" && children !== "" },
    { title: "Your contact", valid: instagram.trim().length >= 3 },
  ];

  const handleSubmit = () => {
    saveApplication({ name, age, city, bio, religion, stayType, children, instagram });
    setSubmitted(true);
  };

  if (applied || submitted) {
    return (
      <div style={{
        minHeight: "100dvh", background: "#060402", color: "#fff",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "0 28px", textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🏨</div>
        <p style={{
          fontSize: 22, fontWeight: 900, margin: "0 0 10px",
          background: "linear-gradient(135deg, #c9a227, #f0d060)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>Application received</p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 32px", lineHeight: 1.65, maxWidth: 320 }}>
          Our team reviews every application personally. If you're selected, you'll receive an invitation via Instagram and your Penthouse dashboard will activate.
        </p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: "0 0 28px" }}>Usually reviewed within 48 hours</p>
        <button
          onClick={() => navigate("/ghost/mode")}
          style={{ background: "none", border: "none", color: "rgba(212,175,55,0.6)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >← Back to Ghost Mode</button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100dvh", background: "#060402", color: "#fff",
      fontFamily: "inherit",
      paddingBottom: "env(safe-area-inset-bottom, 24px)",
    }}>
      {/* Top bar */}
      <div style={{
        background: "rgba(6,4,2,0.97)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(212,175,55,0.1)",
        padding: "14px 16px 12px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 18, cursor: "pointer", padding: 0 }}>←</button>
        <div>
          <p style={{
            fontSize: 16, fontWeight: 900, margin: 0,
            background: "linear-gradient(135deg, #c9a227, #f0d060)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Apply for Penthouse</p>
          <p style={{ fontSize: 9, color: "rgba(212,175,55,0.4)", margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            For women · Curated access · Free
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 20px 0" }}>
        {/* Step indicator */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? "#d4af37" : "rgba(255,255,255,0.08)", transition: "background 0.3s" }} />
          ))}
        </div>

        <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(212,175,55,0.5)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 6px" }}>
          Step {step + 1} of {steps.length}
        </p>
        <p style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 24px" }}>{steps[step].title}</p>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Field label="First name only">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ayu" style={inputStyle} />
              </Field>
              <Field label="Age">
                <input value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="24" style={inputStyle} inputMode="numeric" />
              </Field>
              <Field label="City">
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Jakarta" style={inputStyle} />
              </Field>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Field label={`Bio (${bio.length}/200 · min 40 chars)`}>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 200))}
                  placeholder="Tell guests who you are in your own words..."
                  rows={4}
                  style={{ ...inputStyle, resize: "none" }}
                />
              </Field>
              <Field label="Religion">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {RELIGIONS.map((r) => (
                    <button key={r} onClick={() => setReligion(r)} style={{
                      height: 32, borderRadius: 8, padding: "0 12px", border: "none", cursor: "pointer",
                      background: religion === r ? "rgba(212,175,55,0.18)" : "rgba(255,255,255,0.05)",
                      outline: religion === r ? "1.5px solid rgba(212,175,55,0.55)" : "1px solid rgba(255,255,255,0.1)",
                      color: religion === r ? "#d4af37" : "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 700,
                    }}>{r}</button>
                  ))}
                </div>
              </Field>
              <Field label="Your stay type">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {STAY_TYPES.map((s) => (
                    <button key={s} onClick={() => setStayType(s)} style={{
                      height: 32, borderRadius: 8, padding: "0 12px", border: "none", cursor: "pointer",
                      background: stayType === s ? "rgba(212,175,55,0.18)" : "rgba(255,255,255,0.05)",
                      outline: stayType === s ? "1.5px solid rgba(212,175,55,0.55)" : "1px solid rgba(255,255,255,0.1)",
                      color: stayType === s ? "#d4af37" : "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 700,
                    }}>{s}</button>
                  ))}
                </div>
              </Field>
              <Field label="Children">
                <div style={{ display: "flex", gap: 8 }}>
                  {(["None", "Has children"] as const).map((c) => (
                    <button key={c} onClick={() => setChildren(c)} style={{
                      flex: 1, height: 36, borderRadius: 8, border: "none", cursor: "pointer",
                      background: children === c ? "rgba(212,175,55,0.18)" : "rgba(255,255,255,0.05)",
                      outline: children === c ? "1.5px solid rgba(212,175,55,0.55)" : "1px solid rgba(255,255,255,0.1)",
                      color: children === c ? "#d4af37" : "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 700,
                    }}>{c}</button>
                  ))}
                </div>
              </Field>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Field label="Instagram handle (for admin verification)">
                <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 12 }}>
                  <span style={{ padding: "0 8px 0 12px", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>@</span>
                  <input value={instagram} onChange={(e) => setInstagram(e.target.value.replace(/@/g, ""))} placeholder="yourhandle" style={{ ...inputStyle, background: "none", border: "none", outline: "none", flex: 1, padding: "12px 12px 12px 0" }} />
                </div>
              </Field>
              <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6 }}>
                  Your Instagram is only used for identity verification. It will not be shown on the floor. Admin reviews your profile personally — we keep the floor exclusive.
                </p>
              </div>
              <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: 12, padding: "12px 14px" }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#d4af37", margin: "0 0 4px" }}>For you, it's free</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6 }}>
                  Penthouse access is completely free for women. You earn coins when guests send you gifts and notes — spend them anywhere in the app.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              style={{
                height: 50, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)",
                fontSize: 13, fontWeight: 700, cursor: "pointer", padding: "0 20px",
              }}
            >← Back</button>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (step < steps.length - 1) setStep((s) => s + 1);
              else handleSubmit();
            }}
            disabled={!steps[step].valid}
            style={{
              flex: 1, height: 50, borderRadius: 14, border: "none",
              background: steps[step].valid
                ? "linear-gradient(135deg, #92660a, #d4af37)"
                : "rgba(255,255,255,0.06)",
              color: steps[step].valid ? "#000" : "rgba(255,255,255,0.2)",
              fontSize: 14, fontWeight: 900,
              cursor: steps[step].valid ? "pointer" : "default",
              boxShadow: steps[step].valid ? "0 4px 20px rgba(212,175,55,0.35)" : "none",
            }}
          >
            {step < steps.length - 1 ? "Continue →" : "Submit Application"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>{label}</p>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", borderRadius: 12,
  border: "1px solid rgba(212,175,55,0.2)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff", fontSize: 14, padding: "12px 14px",
  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};
