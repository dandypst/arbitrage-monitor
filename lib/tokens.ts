// Tokens tracked for CROSS-CHAIN arbitrage (same asset, native or canonically
// bridged contract on each chain). Prices are pulled from DefiLlama's coins API,
// keyed as "{chain}:{address}".
//
// ⚠️ VERIFY EVERY ADDRESS before relying on this in production. Contract
// addresses below are best-effort and bridged/native versions of a token can
// have very different addresses (and very different arbitrage semantics) —
// a "gap" between native USDC and a bridged USDC.e is not always a real,
// executable arbitrage. Cross-check on the chain's own explorer.

export type TokenConfig = {
  symbol: string;
  addresses: Record<string, string>; // chain -> contract address
};

export const TOKENS: TokenConfig[] = [
  {
    symbol: "USDC",
    addresses: {
      ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      arbitrum: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      optimism: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      polygon: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      avalanche: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    },
  },
  {
    symbol: "USDT",
    addresses: {
      ethereum: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      arbitrum: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      polygon: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      avalanche: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
    },
  },
  {
    symbol: "WETH",
    addresses: {
      ethereum: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      arbitrum: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
      optimism: "0x4200000000000000000000000000000000000006",
      base: "0x4200000000000000000000000000000000000006",
      polygon: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    },
  },
  {
    symbol: "WBTC",
    addresses: {
      ethereum: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      arbitrum: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
      polygon: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
      optimism: "0x68f180fcCe6836688e9084f035309E29Bf0A2095",
    },
  },
];

// Chains queried for SAME-CHAIN (DEX-to-DEX) arbitrage via Dune. Add/remove
// as needed — this only labels the UI, actual coverage depends on your Dune query.
export const SAME_CHAIN_CHAINS = ["ethereum", "arbitrum", "base", "polygon"];

// Minimum gap to surface as an "opportunity" (percent). Tune to taste —
// real executable arbitrage also needs to clear DEX fees + gas + slippage,
// which this dashboard does NOT account for on its own.
export const MIN_GAP_PCT = 0.25;
