"use client";

import { useEffect, useState, useCallback } from "react";
import Ticker from "@/components/Ticker";
import GapTable from "@/components/GapTable";
import { Opportunity } from "@/lib/types";

const REFRESH_MS = 30_000;

export default function Home() {
  const [crossChain, setCrossChain] = useState<Opportunity[]>([]);
  const [sameChain, setSameChain] = useState<Opportunity[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [ccRes, scRes] = await Promise.all([
        fetch("/api/cross-chain"),
        fetch("/api/same-chain"),
      ]);
      const cc = await ccRes.json();
      const sc = await scRes.json();

      if (cc.error) throw new Error(`cross-chain: ${cc.error}`);
      if (sc.error) throw new Error(`same-chain: ${sc.error}`);

      setCrossChain(cc.opportunities ?? []);
      setSameChain(sc.opportunities ?? []);
      setLastUpdate(Date.now());
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const allSorted = [...crossChain, ...sameChain].sort(
    (a, b) => b.gapPct - a.gapPct
  );

  return (
    <main className="min-h-screen bg-void">
      <Ticker items={allSorted.slice(0, 12)} />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">
              Arb Monitor
            </h1>
            <p className="mt-1 text-sm text-mute">
              Cross-chain gaps via DefiLlama · same-chain DEX gaps via Dune
            </p>
          </div>
          <div className="text-right font-mono text-xs text-mute">
            {loading
              ? "loading…"
              : lastUpdate
              ? `updated ${new Date(lastUpdate).toLocaleTimeString()}`
              : "—"}
            <br />
            refreshes every {REFRESH_MS / 1000}s
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-lg border border-alarm/40 bg-alarm/10 px-4 py-3 text-sm text-alarm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-6 md:flex-row">
          <GapTable
            title="Cross-chain gaps"
            subtitle="Same token, different chains — DefiLlama coin prices"
            items={crossChain}
            emptyHint="No cross-chain gap above threshold right now."
          />
          <GapTable
            title="Same-chain gaps"
            subtitle="Same pair, different DEX — from your Dune query"
            items={sameChain}
            emptyHint="Not configured yet — set DUNE_API_KEY and DUNE_SAME_CHAIN_QUERY_ID in .env.local (see README)."
          />
        </div>

        <p className="mt-8 text-xs text-mute">
          Gaps shown are raw price differences and do not account for DEX
          fees, slippage, bridging cost, or gas — verify profitability before
          executing any trade.
        </p>
      </div>
    </main>
  );
}
