import { useState } from "react";

const DEVICES = [
  { label: "iPhone 14",    w: 390,  h: 844  },
  { label: "iPhone 14 Pro Max", w: 430, h: 932 },
  { label: "iPhone SE",    w: 375,  h: 667  },
  { label: "Pixel 7",      w: 412,  h: 915  },
  { label: "Galaxy S23",   w: 360,  h: 780  },
];

export default function DevPhonePreview() {
  const [open, setOpen] = useState(false);
  const [deviceIdx, setDeviceIdx] = useState(0);
  const device = DEVICES[deviceIdx];

  if (!import.meta.env.DEV) return null;

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Toggle mobile preview"
        style={{
          position: "fixed",
          bottom: 80,
          right: 14,
          zIndex: 99999,
          width: 44,
          height: 44,
          borderRadius: 12,
          background: open ? "#f472b6" : "rgba(20,20,30,0.92)",
          border: open ? "none" : "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          transition: "background 0.2s",
        }}
      >
        📱
      </button>

      {/* Fullscreen overlay */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99998,
            background: "rgba(0,0,0,0.88)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: "20px 0 12px",
          }}
        >
          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {/* Device picker */}
            <select
              value={deviceIdx}
              onChange={(e) => setDeviceIdx(Number(e.target.value))}
              style={{
                height: 32,
                borderRadius: 8,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                padding: "0 10px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {DEVICES.map((d, i) => (
                <option key={d.label} value={i} style={{ background: "#111" }}>
                  {d.label} — {d.w}×{d.h}
                </option>
              ))}
            </select>

            {/* Dimensions badge */}
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>
              {device.w} × {device.h} px
            </span>

            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.6)",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          {/* Phone frame */}
          <div
            style={{
              position: "relative",
              width: device.w + 24,
              height: device.h + 60,
              background: "#0a0a12",
              borderRadius: 48,
              border: "2px solid rgba(255,255,255,0.12)",
              boxShadow: "0 0 0 6px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.9)",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {/* Notch */}
            <div
              style={{
                position: "absolute",
                top: 12,
                left: "50%",
                transform: "translateX(-50%)",
                width: 120,
                height: 28,
                background: "#0a0a12",
                borderRadius: 20,
                zIndex: 2,
                border: "2px solid rgba(255,255,255,0.07)",
              }}
            />

            {/* Screen iframe */}
            <iframe
              src={window.location.href}
              style={{
                position: "absolute",
                top: 30,
                left: 12,
                width: device.w,
                height: device.h,
                border: "none",
                borderRadius: 10,
                background: "#050508",
              }}
              title="Mobile Preview"
            />

            {/* Home indicator */}
            <div
              style={{
                position: "absolute",
                bottom: 8,
                left: "50%",
                transform: "translateX(-50%)",
                width: 100,
                height: 4,
                borderRadius: 2,
                background: "rgba(255,255,255,0.25)",
              }}
            />
          </div>

          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", margin: 0 }}>
            Dev only · not shown in production
          </p>
        </div>
      )}
    </>
  );
}
