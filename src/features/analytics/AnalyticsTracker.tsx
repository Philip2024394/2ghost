/**
 * Drop this anywhere inside <BrowserRouter>.
 * It calls trackPageView on every route change and flushSession on tab close.
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView, flushSession } from "./ghostAnalytics";

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Only track the user-facing app pages, not the admin console
    if (location.pathname.startsWith("/admin")) return;
    trackPageView(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const handler = () => flushSession();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  return null;
}
