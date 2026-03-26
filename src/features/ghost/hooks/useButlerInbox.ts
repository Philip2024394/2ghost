/**
 * useButlerInbox — receives admin-sent Mr. Butlas messages in real-time.
 *
 * Uses Supabase Realtime when connected (instant delivery).
 * Falls back to 30-second polling when offline/not connected.
 *
 * Returns:
 *   broadcast        — active global popup message (null if none / dismissed)
 *   dmMessages       — direct messages addressed to this user
 *   dismissBroadcast — marks the current broadcast as seen on this device
 *   hasDMs           — true if there are unread DMs
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { ghostSupabase } from "../../ghost/ghostSupabase";
import {
  fetchActiveButlerBroadcast,
  fetchButlerDMsForUser,
  dismissButlerBroadcast,
  isButlerBroadcastDismissed,
  type AdminButlerMessage,
} from "../../admin/adminSupabaseService";

const POLL_INTERVAL_MS = 30_000;

function getCurrentUserId(): string | null {
  try {
    const raw = localStorage.getItem("ghost_profile");
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p?.id ?? p?.ghost_id ?? null;
  } catch { return null; }
}

function isSupabaseConnected(): boolean {
  const url = import.meta.env.VITE_GHOST_SUPABASE_URL as string | undefined;
  return !!url && !url.includes("placeholder");
}

export interface ButlerInbox {
  broadcast: AdminButlerMessage | null;
  dmMessages: AdminButlerMessage[];
  dismissBroadcast: () => void;
  hasDMs: boolean;
}

export function useButlerInbox(): ButlerInbox {
  const [broadcast, setBroadcast]   = useState<AdminButlerMessage | null>(null);
  const [dmMessages, setDmMessages] = useState<AdminButlerMessage[]>([]);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const userId = getCurrentUserId();

  const refresh = useCallback(async () => {
    // ── Broadcast ──────────────────────────────────────────────────────────
    const bc = await fetchActiveButlerBroadcast();
    setBroadcast(bc && !isButlerBroadcastDismissed(bc.id) ? bc : null);

    // ── DMs ────────────────────────────────────────────────────────────────
    if (userId) {
      const dms = await fetchButlerDMsForUser(userId);
      setDmMessages(dms);
    }
  }, [userId]);

  useEffect(() => {
    // Initial fetch on mount
    refresh();

    if (isSupabaseConnected()) {
      // ── Real-time: instant delivery via Supabase Realtime ─────────────────
      const channel = ghostSupabase
        .channel("butler_inbox")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "ghost_admin_messages",
          },
          (payload) => {
            const msg = payload.new as AdminButlerMessage;
            if (msg.type === "broadcast" && !isButlerBroadcastDismissed(msg.id)) {
              setBroadcast(msg);
            }
            if (msg.type === "dm" && userId && msg.to_user_id === userId) {
              setDmMessages((prev) => [msg, ...prev]);
            }
          },
        )
        .subscribe();

      return () => {
        ghostSupabase.removeChannel(channel);
      };
    } else {
      // ── Fallback: poll every 30 seconds ──────────────────────────────────
      pollTimer.current = setInterval(refresh, POLL_INTERVAL_MS);
      return () => {
        if (pollTimer.current) clearInterval(pollTimer.current);
      };
    }
  }, [refresh, userId]);

  const handleDismissBroadcast = useCallback(() => {
    if (broadcast) {
      dismissButlerBroadcast(broadcast.id);
      setBroadcast(null);
    }
  }, [broadcast]);

  return {
    broadcast,
    dmMessages,
    dismissBroadcast: handleDismissBroadcast,
    hasDMs: dmMessages.length > 0,
  };
}
