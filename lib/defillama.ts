import { TOKENS, MIN_GAP_PCT } from "./tokens";
import { CrossChainOpportunity } from "./types";

const COINS_ENDPOINT = "https://coins.llama.fi/prices/current";

type LlamaResponse = {
  coins: Record<string, { price: number; symbol: string; timestamp: number }>;
};

export async function fetchCrossChainOpportunities(): Promise<
  CrossChainOpportunity[]
> {
  // Build one batched request: "chain:address,chain:address,..."
  const keys: string[] = [];
  TOKENS.forEach((t) => {
    Object.entries(t.addresses).forEach(([chain, addr]) => {
      keys.push(`${chain}:${addr}`);
    });
  });

  const res = await fetch(`${COINS_ENDPOINT}/${keys.join(",")}`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`DefiLlama request failed: ${res.status}`);
  }

  const data: LlamaResponse = await res.json();
  const opportunities: CrossChainOpportunity[] = [];

  for (const token of TOKENS) {
    const priced: { chain: string; price: number; timestamp: number }[] = [];

    for (const [chain, addr] of Object.entries(token.addresses)) {
      const entry = data.coins[`${chain}:${addr}`];
      if (entry && typeof entry.price === "number") {
        priced.push({ chain, price: entry.price, timestamp: entry.timestamp });
      }
    }

    // Compare every chain pair for this token, keep the ones above threshold
    for (let i = 0; i < priced.length; i++) {
      for (let j = i + 1; j < priced.length; j++) {
        const a = priced[i];
        const b = priced[j];
        const low = a.price < b.price ? a : b;
        const high = a.price < b.price ? b : a;
        if (low.price <= 0) continue;

        const gapPct = ((high.price - low.price) / low.price) * 100;
        if (gapPct >= MIN_GAP_PCT) {
          opportunities.push({
            kind: "cross-chain",
            symbol: token.symbol,
            chainLow: low.chain,
            chainHigh: high.chain,
            priceLow: low.price,
            priceHigh: high.price,
            gapPct,
            timestamp: Math.max(low.timestamp, high.timestamp) * 1000,
          });
        }
      }
    }
  }

  return opportunities.sort((a, b) => b.gapPct - a.gapPct);
}
