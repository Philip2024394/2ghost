// ── Push Notification Service ─────────────────────────────────────────────────
// Handles PWA push subscription, permission requests, and Supabase storage.

import { ghostSupabase as supabase } from "../ghostSupabase";

export const VAPID_PUBLIC_KEY =
  "BIhkXm8QWrL4jMePUmczOF3DmMUCKwIh1VMGHnqpKuQp5iejsh1Di4UT7CEGU1EaTeo2025aO8vL07_3mH7DG5Y";

// ── Helpers ───────────────────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function getGhostId(): string {
  try {
    const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
    return p.id || "anon";
  } catch { return "anon"; }
}

// ── Permission state ──────────────────────────────────────────────────────────
export function getPushPermission(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function hasDismissedPrompt(): boolean {
  try { return localStorage.getItem("ghost_push_dismissed") === "1"; } catch { return false; }
}
export function markPromptDismissed(): void {
  try { localStorage.setItem("ghost_push_dismissed", "1"); } catch {}
}
export function isSubscribed(): boolean {
  try { return localStorage.getItem("ghost_push_subscribed") === "1"; } catch { return false; }
}

// ── Subscribe ─────────────────────────────────────────────────────────────────
export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer,
    });

    const ghostId = getGhostId();
    const subJson = subscription.toJSON();

    // Save to Supabase
    try {
      await supabase.from("push_subscriptions").upsert({
        ghost_id: ghostId,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh ?? "",
        auth: subJson.keys?.auth ?? "",
        user_agent: navigator.userAgent.slice(0, 200),
        updated_at: new Date().toISOString(),
      }, { onConflict: "ghost_id" });
    } catch {
      // Supabase optional — store locally as fallback
    }

    // Also save locally so we can reference it
    try { localStorage.setItem("ghost_push_subscribed", "1"); } catch {}
    try { localStorage.setItem("ghost_push_endpoint", subJson.endpoint ?? ""); } catch {}

    return true;
  } catch {
    return false;
  }
}

// ── Unsubscribe ───────────────────────────────────────────────────────────────
export async function unsubscribeFromPush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    const ghostId = getGhostId();
    await supabase.from("push_subscriptions").delete().eq("ghost_id", ghostId);
    localStorage.removeItem("ghost_push_subscribed");
    localStorage.removeItem("ghost_push_endpoint");
  } catch {}
}

// ── Local test notification (no server needed) ────────────────────────────────
export async function sendLocalNotification(title: string, body: string, url = "/mode"): Promise<void> {
  if (getPushPermission() !== "granted") return;
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-72.png",
      tag: "ghost-local",
      data: { url },
    });
  } catch {}
}

// ── Notification triggers (call these from app events) ────────────────────────
export function notifyNewMatch(matchName: string) {
  sendLocalNotification(
    "💘 New Match — Hearts Way Hotel",
    `${matchName} liked you back. Open your vault before they move on.`,
    "/mode"
  );
}

export function notifyNewMessage(senderName: string) {
  sendLocalNotification(
    "💬 New Message",
    `${senderName} sent you a message in the floor chat.`,
    "/mode"
  );
}

export function notifyVaultMessage(senderName: string) {
  sendLocalNotification(
    "🔐 Secret Message",
    `${senderName} sent you a secret message in your vault.`,
    "/room"
  );
}

export function notifyGiftReceived(senderName: string, giftName: string) {
  sendLocalNotification(
    "🎁 Gift Received",
    `${senderName} sent you a ${giftName}!`,
    "/mode"
  );
}

export function notifyButlerReady() {
  sendLocalNotification(
    "🎩 Mr Butlas",
    "Your butler has a curated match ready for you. Come see.",
    "/mode"
  );
}
