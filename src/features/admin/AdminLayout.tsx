import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard, Users, CreditCard, Wrench,
  Ghost, LogOut, UserCheck, ChevronRight,
} from "lucide-react";
import { isAdminAuthenticated, adminLogout } from "./adminAuth";

const LOGO = "https://ik.imagekit.io/7grri5v7d/sdfasdfasdfsdfasdfasdfsdfdfasdfasasdasdasd.png";

const NAV = [
  { path: "/admin/overview",  label: "Overview",       icon: LayoutDashboard },
  { path: "/admin/profiles",  label: "Mock Profiles",  icon: Ghost           },
  { path: "/admin/users",     label: "Real Users",     icon: UserCheck       },
  { path: "/admin/payments",  label: "Payments",       icon: CreditCard      },
  { path: "/admin/services",  label: "Butler Services",icon: Wrench          },
];

const MIN_WIDTH = 1024;

export default function AdminLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= MIN_WIDTH);

  useEffect(() => {
    if (!isAdminAuthenticated()) navigate("/admin/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= MIN_WIDTH);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
              <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(74,222,128,0.7)", letterSpacing: "0.16em", textTransform: "uppercase", margin: 0 }}>2Ghost</p>
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

        {/* Bottom: Admin info + logout */}
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
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
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: "auto", minHeight: "100dvh" }}>
        <Outlet />
      </main>
    </div>
  );
}
