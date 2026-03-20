/**
 * 2Ghost — Profile persistence service
 * Saves to Supabase DB + Storage (primary) with localStorage as local cache.
 */
import { ghostSupabase } from "./ghostSupabase";
import { uploadGhostImage } from "./ghostStorage";

const GHOST_PROFILE_KEY = "ghost_profile";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProfileInput {
  photo: string | null;
  name: string;
  age: number;
  city: string;
  country: string;
  countryFlag: string;
  countryCode: string;
  gender: string;
  interest: string;
  bio?: string | null;
  firstDateIdea?: string | null;
  religion?: string | null;
  lookingFor?: string | null;
  connectPhone?: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** If photo is a base64 data URL, upload to Supabase Storage and return CDN URL. */
async function uploadPhotoIfNeeded(photo: string | null, ghostId: string): Promise<string | null> {
  if (!photo) return null;
  if (!photo.startsWith("data:")) return photo; // already a URL

  const res = await fetch(photo);
  const blob = await res.blob();
  const ext = blob.type.split("/")[1] || "jpg";
  const file = new File([blob], `profile.${ext}`, { type: blob.type });
  return uploadGhostImage(file, ghostId);
}

// ── Save ─────────────────────────────────────────────────────────────────────

/**
 * Upserts the profile to Supabase ghost_profiles table.
 * Also uploads the photo to Storage if it's still a base64 data URL.
 * Updates localStorage photo URL to the CDN URL if it changed.
 */
export async function saveProfileToSupabase(phone: string, data: ProfileInput): Promise<void> {
  const photoUrl = await uploadPhotoIfNeeded(data.photo, phone);

  const { error } = await ghostSupabase
    .from("ghost_profiles")
    .upsert(
      {
        ghost_id: phone,
        whatsapp: phone,
        display_name: data.name,
        gender: data.gender,
        interest: data.interest,
        verified: false,
        photo_url: photoUrl,
        age: data.age,
        city: data.city,
        country: data.country,
        country_flag: data.countryFlag,
        country_code: data.countryCode,
        bio: data.bio ?? null,
        first_date_idea: data.firstDateIdea ?? null,
        religion: data.religion ?? null,
        looking_for: data.lookingFor ?? null,
        connect_phone: data.connectPhone ?? null,
      },
      { onConflict: "ghost_id" }
    );

  if (error) {
    console.error("[2Ghost] Supabase profile save failed:", error.message);
    throw error;
  }

  // If photo was uploaded, update the local cache to use the CDN URL
  if (photoUrl && photoUrl !== data.photo) {
    try {
      const local = JSON.parse(localStorage.getItem(GHOST_PROFILE_KEY) || "{}");
      localStorage.setItem(GHOST_PROFILE_KEY, JSON.stringify({ ...local, photo: photoUrl }));
    } catch {}
  }
}

// ── Load ─────────────────────────────────────────────────────────────────────

/**
 * Fetches a profile from Supabase by phone number.
 * Returns a localStorage-compatible profile object, or null if not found.
 */
export async function loadProfileFromSupabase(phone: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await ghostSupabase
    .from("ghost_profiles")
    .select("*")
    .eq("ghost_id", phone)
    .maybeSingle();

  if (error || !data) return null;

  return {
    photo: data.photo_url ?? null,
    name: data.display_name ?? "",
    age: data.age ?? 0,
    city: data.city ?? "",
    country: data.country ?? "",
    countryFlag: data.country_flag ?? "🌍",
    countryCode: data.country_code ?? "",
    gender: data.gender ?? "",
    interest: data.interest ?? "",
    bio: data.bio ?? null,
    firstDateIdea: data.first_date_idea ?? null,
    religion: data.religion ?? null,
    lookingFor: data.looking_for ?? null,
    connectPhone: data.connect_phone ?? null,
    connectAlt: null,
    connectAltHandle: null,
    verified: data.verified ?? false,
    idVerified: false,
  };
}
