/**
 * useDateInvites
 * Real-time listener for incoming date invites (ghost_date_invites table).
 * Subscribes to pending invites addressed to the current user's ghost_id.
 * Also exposes helpers for sending, accepting, declining, and unlocking contacts.
 */
import { useState, useEffect, useCallback } from "react";
import { ghostSupabase } from "../ghostSupabase";

export interface DateInvite {
  id: string;
  from_guest_id: string;
  from_name: string;
  from_age: number;
  from_city: string;
  from_flag: string;
  from_image: string;
  to_guest_id: string;
  post_id: string;
  post_title: string;
  post_image: string;
  post_location: string;
  status: "pending" | "accepted" | "declined" | "revealed";
  accepted_contact_pref?: string;
  accepted_contact_value?: string;
  contact_unlocked?: boolean;
  created_at?: string;
}

function getMyGhostId(): string {
  try {
    const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
    return p.ghost_id || p.phone || "";
  } catch { return ""; }
}

function getMyContactInfo(): { pref: string; value: string } {
  try {
    const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
    const pref  = p.contactPref || p.contact_pref || "chat";
    const value = p.connectPhone || p.connect_phone || p.connectAltHandle || p.connect_alt_handle || "";
    return { pref, value };
  } catch { return { pref: "chat", value: "" }; }
}

// ── Send an invite ─────────────────────────────────────────────────────────────
export async function sendDateInvite(payload: Omit<DateInvite, "id" | "status" | "created_at">) {
  const invite: Omit<DateInvite, "id"> = { ...payload, status: "pending" };
  return ghostSupabase.from("ghost_date_invites").insert(invite);
}

// ── Accept an invite ───────────────────────────────────────────────────────────
export async function acceptDateInvite(inviteId: string) {
  const { pref, value } = getMyContactInfo();
  await ghostSupabase
    .from("ghost_date_invites")
    .update({ status: "accepted", accepted_contact_pref: pref, accepted_contact_value: value })
    .eq("id", inviteId);
}

// ── Decline an invite ──────────────────────────────────────────────────────────
export async function declineDateInvite(inviteId: string) {
  await ghostSupabase
    .from("ghost_date_invites")
    .update({ status: "declined" })
    .eq("id", inviteId);
}

// ── Mark contact unlocked (after coin payment) ─────────────────────────────────
export async function unlockDateContact(inviteId: string) {
  await ghostSupabase
    .from("ghost_date_invites")
    .update({ status: "revealed", contact_unlocked: true })
    .eq("id", inviteId);
}

// ── Hook: listen for incoming pending invites ──────────────────────────────────
export function useDateInvites() {
  const [pendingInvite, setPendingInvite] = useState<DateInvite | null>(null);
  // Invites that were accepted by others (inviter side notifications)
  const [acceptedInvite, setAcceptedInvite] = useState<DateInvite | null>(null);

  useEffect(() => {
    const myId = getMyGhostId();
    if (!myId) return;

    // ── Subscribe: invites TO me (recipient) ──
    const recipientSub = ghostSupabase
      .channel(`date_invites_to_${myId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ghost_date_invites",
          filter: `to_guest_id=eq.${myId}`,
        },
        (payload) => {
          const invite = payload.new as DateInvite;
          if (invite.status === "pending") setPendingInvite(invite);
        }
      )
      .subscribe();

    // ── Subscribe: invites FROM me accepted by others (sender) ──
    const senderSub = ghostSupabase
      .channel(`date_invites_from_${myId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ghost_date_invites",
          filter: `from_guest_id=eq.${myId}`,
        },
        (payload) => {
          const invite = payload.new as DateInvite;
          if (invite.status === "accepted" && !invite.contact_unlocked) {
            setAcceptedInvite(invite);
          }
        }
      )
      .subscribe();

    return () => {
      ghostSupabase.removeChannel(recipientSub);
      ghostSupabase.removeChannel(senderSub);
    };
  }, []);

  const dismissPending  = useCallback(() => setPendingInvite(null),  []);
  const dismissAccepted = useCallback(() => setAcceptedInvite(null), []);

  return { pendingInvite, acceptedInvite, dismissPending, dismissAccepted };
}
