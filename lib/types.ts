export type CrossChainOpportunity = {
  kind: "cross-chain";
  symbol: string;
  chainLow: string;
  chainHigh: string;
  priceLow: number;
  priceHigh: number;
  gapPct: number;
  timestamp: number;
};

export type SameChainOpportunity = {
  kind: "same-chain";
  chain: string;
  pair: string;
  dexLow: string;
  dexHigh: string;
  priceLow: number;
  priceHigh: number;
  gapPct: number;
  timestamp: number;
};

export type Opportunity = CrossChainOpportunity | SameChainOpportunity;
