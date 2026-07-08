import { MIN_GAP_PCT } from "./tokens";
import { SameChainOpportunity } from "./types";

// Expected row shape from your saved Dune query (see README for the SQL
// starter). Column names are matched case-insensitively below.
type DuneRow = {
  chain: string;
  pair: string;
  dex: string;
  price: number;
  updated_at?: string;
};

type DuneResultsResponse = {
  result?: {
    rows: Record<string, unknown>[];
  };
  error?: string;
};

function normalizeRow(row: Record<string, unknown>): DuneRow | null {
  const get = (name: string) =>
    row[name] ?? row[name.toLowerCase()] ?? row[name.toUpperCase()];

  const chain = get("chain");
  const pair = get("pair") ?? get("token_pair");
  const dex = get("dex") ?? get("project");
  const price = get("price") ?? get("avg_price");
  const updated_at = get("updated_at") ?? get("block_time");

  if (
    typeof chain !== "string" ||
    typeof pair !== "string" ||
    typeof dex !== "string" ||
    typeof price !== "number"
  ) {
    return null;
  }

  return {
    chain,
    pair,
    dex,
    price,
    updated_at: typeof updated_at === "string" ? updated_at : undefined,
  };
}

export async function fetchSameChainOpportunities(): Promise<
  SameChainOpportunity[]
> {
  const apiKey = process.env.DUNE_API_KEY;
  const queryId = process.env.DUNE_SAME_CHAIN_QUERY_ID;

  if (!apiKey || !queryId) {
    // Not configured yet — return empty rather than throwing, so the
    // cross-chain panel still works out of the box.
    return [];
  }

  // Uses the "latest cached results" endpoint (no execution credits spent).
  // Schedule your Dune query to refresh on its own cadence.
  const res = await fetch(
    `https://api.dune.com/api/v1/query/${queryId}/results?limit=1000`,
    {
      headers: { "X-Dune-API-Key": apiKey },
      next: { revalidate: 0 },
    }
  );

  if (!res.ok) {
    throw new Error(`Dune request failed: ${res.status}`);
  }

  const data: DuneResultsResponse = await res.json();
  const rows = (data.result?.rows ?? [])
    .map(normalizeRow)
    .filter((r): r is DuneRow => r !== null);

  // Group by chain + pair, then compare DEXes pairwise
  const groups = new Map<string, DuneRow[]>();
  for (const row of rows) {
    const key = `${row.chain}::${row.pair}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const opportunities: SameChainOpportunity[] = [];

  for (const [, group] of groups) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];
        if (a.dex === b.dex) continue;
        const low = a.price < b.price ? a : b;
        const high = a.price < b.price ? b : a;
        if (low.price <= 0) continue;

        const gapPct = ((high.price - low.price) / low.price) * 100;
        if (gapPct >= MIN_GAP_PCT) {
          opportunities.push({
            kind: "same-chain",
            chain: low.chain,
            pair: low.pair,
            dexLow: low.dex,
            dexHigh: high.dex,
            priceLow: low.price,
            priceHigh: high.price,
            gapPct,
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  return opportunities.sort((a, b) => b.gapPct - a.gapPct);
}
