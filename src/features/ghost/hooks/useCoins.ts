import { useState, useCallback } from "react";
import { ghostSupabase } from "../ghostSupabase";

const BALANCE_KEY = "ghost_coins";
const TX_KEY      = "ghost_coin_transactions";

export type CoinTransaction = {
  id: string;
  type: "purchase" | "win" | "spend" | "bonus" | "refund";
  amount: number;          // positive = credit, negative = debit
  description: string;
  ts: number;
};

function readBalance(): number {
  try { return Math.max(0, parseInt(localStorage.getItem(BALANCE_KEY) || "0", 10)); }
  catch { return 0; }
}

function writeBalance(n: number) {
  try { localStorage.setItem(BALANCE_KEY, String(Math.max(0, Math.round(n)))); } catch {}
}

export function readTransactions(): CoinTransaction[] {
  try { return JSON.parse(localStorage.getItem(TX_KEY) || "[]"); } catch { return []; }
}

function appendTransaction(tx: Omit<CoinTransaction, "id" | "ts">) {
  try {
    const all = readTransactions();
    const entry: CoinTransaction = { ...tx, id: crypto.randomUUID(), ts: Date.now() };
    // keep last 100 only
    localStorage.setItem(TX_KEY, JSON.stringify([entry, ...all].slice(0, 100)));
    // Sync to Supabase non-blocking
    try {
      const raw = localStorage.getItem("ghost_profile");
      if (raw) {
        const profile = JSON.parse(raw);
        if (profile.ghost_id) {
          ghostSupabase.from("ghost_coin_transactions").insert({
            id:          entry.id,
            ghost_id:    profile.ghost_id,
            type:        entry.type,
            amount:      entry.amount,
            description: entry.description,
            ts:          entry.ts,
          }).then(() => {}).catch(() => {});
        }
      }
    } catch {}
  } catch {}
}

async function syncToSupabase(balance: number) {
  try {
    const raw = localStorage.getItem("ghost_profile");
    if (!raw) return;
    const profile = JSON.parse(raw);
    if (!profile.ghost_id) return;
    await ghostSupabase
      .from("ghost_profiles")
      .update({ coin_balance: balance, updated_at: new Date().toISOString() })
      .eq("ghost_id", profile.ghost_id);
  } catch {}
}

export function useCoins() {
  const [balance, setBalance] = useState<number>(readBalance);

  const _set = useCallback((newBal: number) => {
    const safe = Math.max(0, Math.round(newBal));
    writeBalance(safe);
    setBalance(safe);
    syncToSupabase(safe);
  }, []);

  const addCoins = useCallback((amount: number, description: string, type: CoinTransaction["type"] = "win") => {
    const newBal = readBalance() + Math.round(amount);
    _set(newBal);
    appendTransaction({ type, amount: Math.round(amount), description });
    return newBal;
  }, [_set]);

  const deductCoins = useCallback((amount: number, description: string): boolean => {
    const current = readBalance();
    if (current < amount) return false;
    const newBal = current - Math.round(amount);
    _set(newBal);
    appendTransaction({ type: "spend", amount: -Math.round(amount), description });
    return true;
  }, [_set]);

  const canAfford = useCallback((amount: number) => readBalance() >= amount, []);

  const purchaseCoins = useCallback((coins: number, packName: string) => {
    addCoins(coins, `Purchased ${packName}`, "purchase");
  }, [addCoins]);

  return { balance, addCoins, deductCoins, canAfford, purchaseCoins };
}
