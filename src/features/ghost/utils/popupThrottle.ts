/**
 * popupThrottle — Global auto-popup rate limiter
 *
 * Enforces a minimum gap between any automatically triggered popup
 * (ones the user didn't explicitly tap to open).
 *
 * User-initiated sheets (tapping a button) bypass this entirely.
 *
 * Usage:
 *   if (!canShowAutoPopup()) return;   // inside a setTimeout callback
 *   markAutoPopupShown();              // call immediately after showing
 */

const KEY         = "ghost_last_auto_popup_at";
const MIN_GAP_MS  = 5 * 60 * 1000;   // 5 minutes between auto-popups

/**
 * Returns true only if no auto-popup has been shown in the last 5 minutes.
 */
export function canShowAutoPopup(): boolean {
  try {
    const last = parseInt(localStorage.getItem(KEY) || "0", 10);
    return Date.now() - last >= MIN_GAP_MS;
  } catch { return true; }
}

/**
 * Call this immediately when an auto-popup becomes visible.
 * Blocks all other auto-popups for the next 5 minutes.
 */
export function markAutoPopupShown(): void {
  try {
    localStorage.setItem(KEY, String(Date.now()));
  } catch {}
}

/**
 * How many ms remain until the next auto-popup is allowed.
 * Returns 0 if the slot is already free.
 */
export function msUntilNextPopup(): number {
  try {
    const last = parseInt(localStorage.getItem(KEY) || "0", 10);
    return Math.max(0, MIN_GAP_MS - (Date.now() - last));
  } catch { return 0; }
}
