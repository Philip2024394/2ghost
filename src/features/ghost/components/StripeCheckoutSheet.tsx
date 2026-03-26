/**
 * StripeCheckoutSheet — Embedded Stripe checkout inside a dark gold bottom sheet.
 * Users never leave the app. Payment UI matches the hotel aesthetic.
 *
 * Usage:
 *   <StripeCheckoutSheet
 *     priceId="price_xxx"
 *     ghostId="..."
 *     label="150 Coins — $9.99"
 *     onClose={() => setOpen(false)}
 *     onSuccess={() => navigate('/ghost/payment-success?plan=coins&amount=150')}
 *   />
 */

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { ghostSupabase } from "../ghostSupabase";

// ── Stripe singleton ──────────────────────────────────────────────────────────
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string
);

// ── Types ────────────────────────────────────────────────────────────────────
interface Props {
  priceId:    string;
  ghostId:    string;
  label:      string;          // e.g. "150 Coins — $9.99"
  returnPath: string;          // e.g. "/ghost/payment-success?plan=coins&amount=150"
  onClose:    () => void;
  onSuccess?: () => void;      // called when Stripe reports complete (optional)
}

// ── Component ────────────────────────────────────────────────────────────────
export default function StripeCheckoutSheet({
  priceId, ghostId, label, returnPath, onClose, onSuccess,
}: Props) {
  const [clientSecret, setClientSecret]   = useState<string | null>(null);
  const [error, setError]                 = useState<string | null>(null);
  const [loading, setLoading]             = useState(true);

  // Build the return URL (Stripe redirects here after payment, even embedded)
  const returnUrl = `${window.location.origin}${returnPath}`;

  // Fetch client secret from our edge function
  const fetchSecret = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await ghostSupabase.functions.invoke(
        "create-checkout",
        { body: { priceId, ghostId, returnUrl } }
      );
      if (fnErr || !data?.clientSecret) {
        throw new Error(fnErr?.message ?? "Failed to start checkout");
      }
      setClientSecret(data.clientSecret);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [priceId, ghostId, returnUrl]);

  useEffect(() => {
    fetchSecret();
  }, [fetchSecret]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.88)",
          backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
        }}
      />

      {/* Sheet */}
      <motion.div
        key="sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        onClick={e => e.stopPropagation()}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10000,
          maxWidth: 520, margin: "0 auto",
          background: "#07060a",
          borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(212,175,55,0.22)",
          borderBottom: "none",
          maxHeight: "94dvh",
          display: "flex", flexDirection: "column",
          boxShadow: "0 -16px 64px rgba(212,175,55,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Animated gold top bar */}
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          style={{
            height: 3, flexShrink: 0,
            background: "linear-gradient(90deg, #92660a, #d4af37, #f0d060, #d4af37, #92660a)",
            borderRadius: "3px 3px 0 0",
          }}
        />

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px 12px", flexShrink: 0,
          borderBottom: "1px solid rgba(212,175,55,0.1)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>
              🔐
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff" }}>
                Secure Checkout
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(212,175,55,0.7)", fontWeight: 600 }}>
                {label}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "50%", border: "none",
              background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)",
              fontSize: 16, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Stripe badges */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 16, padding: "10px 20px", flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}>
          {["🔒 SSL Encrypted", "💳 Stripe Secured", "🛡️ PCI Compliant"].map(badge => (
            <span key={badge} style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.04em" }}>
              {badge}
            </span>
          ))}
        </div>

        {/* Checkout body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 0 max(24px,env(safe-area-inset-bottom,24px))" }}>

          {/* Loading state */}
          {loading && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", padding: "60px 0", gap: 16,
            }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                style={{
                  width: 40, height: 40, borderRadius: "50%",
                  border: "3px solid rgba(212,175,55,0.15)",
                  borderTop: "3px solid #d4af37",
                }}
              />
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                Preparing secure checkout…
              </p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div style={{ padding: "32px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 28, margin: "0 0 12px" }}>⚠️</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#f87171", margin: "0 0 8px" }}>
                Checkout failed to load
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 20px" }}>
                {error}
              </p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={fetchSecret}
                style={{
                  height: 44, borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg,#92660a,#d4af37)",
                  color: "#000", fontSize: 13, fontWeight: 900, cursor: "pointer",
                  padding: "0 28px",
                }}
              >
                Try Again
              </motion.button>
            </div>
          )}

          {/* Stripe Embedded Checkout */}
          {!loading && !error && clientSecret && (
            <div style={{ padding: "8px 16px 0" }}>
              {/* Injected Stripe appearance overrides */}
              <style>{`
                #stripe-checkout-iframe,
                iframe[title*="Stripe"] {
                  border-radius: 16px !important;
                  overflow: hidden !important;
                }
              `}</style>
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{
                  clientSecret,
                  onComplete: () => {
                    onSuccess?.();
                    onClose();
                  },
                }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
