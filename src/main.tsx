import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./shared/components/ErrorBoundary";

document.documentElement.classList.remove("dark");

if ("serviceWorker" in navigator && !window.location.hostname.includes("localhost")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((registration) => {
      // When a new service worker is found, skip waiting immediately so it
      // activates as soon as it finishes installing — no user action needed.
      registration.addEventListener("updatefound", () => {
        const incoming = registration.installing;
        if (!incoming) return;
        incoming.addEventListener("statechange", () => {
          if (incoming.state === "installed" && navigator.serviceWorker.controller) {
            // New version ready — tell it to take over now
            incoming.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });

      // Poll for updates every 60 seconds so long-running sessions catch deploys
      setInterval(() => registration.update(), 60_000);
    }).catch(() => {});

    // When the active SW changes (new one took control) — reload the page
    // so users get the fresh assets. Guard against double-reload.
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!reloading) {
        reloading = true;
        window.location.reload();
      }
    });
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
