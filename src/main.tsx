import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./shared/components/ErrorBoundary";

document.documentElement.classList.remove("dark");

if ("serviceWorker" in navigator && !window.location.hostname.includes("localhost")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// In development: unregister any stale service workers so cached chunks don't break HMR
if (window.location.hostname.includes("localhost")) {
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
