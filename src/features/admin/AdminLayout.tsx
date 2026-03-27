import { useEffect, useState, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard, Users, CreditCard, Wrench,
  Ghost, LogOut, UserCheck, ChevronRight, ClipboardList, Activity, BarChart2,
  Monitor, X, RefreshCw, ExternalLink, Smartphone, ShieldCheck, Gift, Sparkles, TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isAdminAuthenticated, adminLogout } from "./adminAuth";

const LOGO = "https://ik.imagekit.io/7grri5v7d/sdfasdfasdfsdfasdfasdfsdfdfasdfasasdasdasd.png";

const NAV = [
  { path: "/admin/overview",  label: "Overview",       icon: LayoutDashboard },
  { path: "/admin/tasks",     label: "Daily Tasks",    icon: ClipboardList   },
  { path: "/admin/health",    label: "App Health",     icon: Activity        },
  { path: "/admin/traffic",   label: "Traffic",        icon: BarChart2       },
  { path: "/admin/profiles",  label: "Mock Profiles",  icon: Ghost           },
  { path: "/admin/users",     label: "Real Users",     icon: UserCheck       },
  { path: "/admin/control",  label: "User Control",   icon: ShieldCheck     },
  { path: "/admin/payments",  label: "Payments",       icon: CreditCard      },
  { path: "/admin/stripe",    label: "Stripe Revenue", icon: TrendingUp      },
  { path: "/admin/services",  label: "Butler Services",icon: Wrench          },
  { path: "/admin/gifts",      label: "Floor Gifts",    icon: Gift            },
  { path: "/admin/activities", label: "Social Activities", icon: Sparkles       },
];

// Map admin route → live app route
const PREVIEW_MAP: Record<string, string> = {
  "/admin/overview":  "/ghost",
  "/admin/tasks":     "/ghost",
  "/admin/health":    "/ghost",
  "/admin/traffic":   "/ghost",
  "/admin/profiles":  "/ghost",
  "/admin/users":     "/ghost",
  "/admin/payments":  "/ghost",
  "/admin/services":  "/butler",
};

const MIN_WIDTH = 1024;

export default function AdminLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= MIN_WIDTH);
  const [preview, setPreview]     = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // drag state
  const [pos, setPos]   = useState({ x: 0, y: 80 });
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const PANEL_W = 390;

  // Default x: right edge of viewport minus panel width minus 24px gap
  useEffect(() => {
    setPos({ x: window.innerWidth - PANEL_W - 24, y: 80 });
  }, []);

  useEffect(() => {
    if (!isAdminAuthenticated()) navigate("/admin/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    document.body.classList.add("admin-mode");
    return () => document.body.classList.remove("admin-mode");
  }, []);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= MIN_WIDTH);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Drag handlers
  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    e.preventDefault();
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - dragStart.current.mx;
      const dy = e.clientY - dragStart.current.my;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - PANEL_W - 4, dragStart.current.px + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 120, dragStart.current.py + dy)),
      });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  const previewPath = PREVIEW_MAP[location.pathname] ?? "/ghost";
  const previewSrc  = window.location.origin + previewPath;

  if (!isDesktop) {
    return (
      <div style={{
        minHeight: "100dvh", background: "#06060e", color: "#fff",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "32px 24px", textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🖥️</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 10px" }}>Desktop Required</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: "0 0 6px", lineHeight: 1.6, maxWidth: 280 }}>
          The Admin Console is designed for desktop use.
        </p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", margin: 0 }}>
          Please open on a screen wider than {MIN_WIDTH}px.
        </p>
      </div>
    );
  }

  const handleLogout = () => {
    adminLogout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "#06060e", color: "#fff" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 230, flexShrink: 0,
        background: "#09091a", borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100dvh", overflow: "hidden",
      }}>
        {/* Brand */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={LOGO} alt="" style={{ width: 34, height: 34, objectFit: "contain" }} />
            <div>
              <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(74,222,128,0.7)", letterSpacing: "0.16em", textTransform: "uppercase", margin: 0 }}>Mr Butlas</p>
              <p style={{ fontSize: 13, fontWeight: 900, color: "#fff", margin: 0 }}>Admin Console</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 8px", margin: "0 0 4px" }}>
            Management
          </p>
          {NAV.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10, textDecoration: "none",
                  background: active ? "rgba(74,222,128,0.1)" : "transparent",
                  border: active ? "1px solid rgba(74,222,128,0.2)" : "1px solid transparent",
                  color: active ? "#4ade80" : "rgba(255,255,255,0.5)",
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  transition: "all 0.15s",
                }}
              >
                <Icon size={16} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {active && <ChevronRight size={12} />}
              </Link>
            );
          })}
        </nav>

        {/* Live Preview button */}
        <div style={{ padding: "12px 12px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => setPreview((v) => !v)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "10px 12px", borderRadius: 10,
              border: preview ? "1px solid rgba(74,222,128,0.35)" : "1px solid rgba(255,255,255,0.08)",
              background: preview ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.03)",
              color: preview ? "#4ade80" : "rgba(255,255,255,0.55)",
              fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <Smartphone size={14} />
            <span style={{ flex: 1 }}>Live Preview</span>
            {preview && (
              <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(74,222,128,0.2)", color: "#4ade80", borderRadius: 4, padding: "2px 5px", letterSpacing: "0.06em" }}>ON</span>
            )}
          </button>
        </div>

        {/* Bottom: Admin info + logout */}
        <div style={{ padding: "12px 12px", borderTop: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#4ade80,#22c55e)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Users size={14} style={{ color: "#fff" }} />
            </div>
            <div style={{ overflow: "hidden" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Admin</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>2dateme.com</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "9px 12px", borderRadius: 10, border: "none",
              background: "transparent", color: "rgba(239,68,68,0.6)",
              fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: "auto", minHeight: "100dvh", width: 0 }}>
        <Outlet />
      </main>

      {/* ── Live Preview Panel (draggable floating phone) ── */}
      <AnimatePresence>
        {preview && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              position: "fixed",
              left: pos.x,
              top: pos.y,
              zIndex: 9999,
              width: PANEL_W,
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)",
              borderRadius: 20,
              overflow: "hidden",
              background: "#0a0a18",
              userSelect: "none",
            }}
          >
            {/* Drag handle / title bar */}
            <div
              onMouseDown={onMouseDown}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px",
                background: "#0f0f20",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                cursor: "grab",
              }}
            >
              {/* Traffic lights */}
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
              </div>

              <Monitor size={12} style={{ color: "rgba(255,255,255,0.3)", marginLeft: 4 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", flex: 1 }}>
                Live Preview — {previewPath}
              </span>

              {/* Reload */}
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setIframeKey((k) => k + 1)}
                title="Reload preview"
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", padding: 4, display: "flex", alignItems: "center", borderRadius: 6 }}
              >
                <RefreshCw size={12} />
              </button>

              {/* Open in new tab */}
              <a
                href={previewSrc}
                target="_blank"
                rel="noopener noreferrer"
                onMouseDown={(e) => e.stopPropagation()}
                title="Open in new tab"
                style={{ color: "rgba(255,255,255,0.35)", padding: 4, display: "flex", alignItems: "center", borderRadius: 6 }}
              >
                <ExternalLink size={12} />
              </a>

              {/* Close */}
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setPreview(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", padding: 4, display: "flex", alignItems: "center", borderRadius: 6 }}
              >
                <X size={13} />
              </button>
            </div>

            {/* URL bar */}
            <div style={{ padding: "7px 12px", background: "#0d0d1c", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "4px 10px" }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
                  {previewSrc}
                </span>
              </div>
            </div>

            {/* iFrame — mobile width */}
            <div style={{ position: "relative", background: "#000" }}>
              <iframe
                key={iframeKey}
                src={previewSrc}
                title="Live app preview"
                style={{
                  width: "100%",
                  height: 680,
                  border: "none",
                  display: "block",
                  background: "#000",
                }}
                allow="same-origin"
              />
            </div>

            {/* Bottom bar */}
            <div style={{ padding: "8px 14px", background: "#0f0f20", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 5px #4ade80" }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>Live · Drag to reposition</span>
              <button
                onClick={() => setIframeKey((k) => k + 1)}
                style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: "rgba(74,222,128,0.6)", fontSize: 10, fontWeight: 700 }}
              >
                <RefreshCw size={10} /> Refresh
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
