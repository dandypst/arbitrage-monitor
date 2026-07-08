import { NextRequest, NextResponse } from "next/server";
import { fetchCrossChainOpportunities } from "@/lib/defillama";
import { fetchSameChainOpportunities } from "@/lib/dune";
import { sendTelegramMessage } from "@/lib/telegram";
import { shouldAlert, markAlerted } from "@/lib/alertState";
import { Opportunity } from "@/lib/types";

function keyOf(o: Opportunity): string {
  return o.kind === "cross-chain"
    ? `cc:${o.symbol}:${o.chainLow}:${o.chainHigh}`
    : `sc:${o.chain}:${o.pair}:${o.dexLow}:${o.dexHigh}`;
}

function formatMessage(o: Opportunity): string {
  if (o.kind === "cross-chain") {
    return (
      `🔀 <b>Cross-chain gap: ${o.symbol}</b>\n` +
      `${o.chainLow} $${o.priceLow.toFixed(4)} → ${o.chainHigh} $${o.priceHigh.toFixed(4)}\n` +
      `Gap: <b>+${o.gapPct.toFixed(2)}%</b>`
    );
  }
  return (
    `⚡ <b>Same-chain gap: ${o.pair} (${o.chain})</b>\n` +
    `${o.dexLow} $${o.priceLow.toFixed(4)} → ${o.dexHigh} $${o.priceHigh.toFixed(4)}\n` +
    `Gap: <b>+${o.gapPct.toFixed(2)}%</b>`
  );
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const alertThreshold = Number(process.env.ALERT_MIN_GAP_PCT ?? "1");

  try {
    const [crossChain, sameChain] = await Promise.all([
      fetchCrossChainOpportunities(),
      fetchSameChainOpportunities(),
    ]);

    const candidates = [...crossChain, ...sameChain].filter(
      (o) => o.gapPct >= alertThreshold
    );

    let sent = 0;
    for (const o of candidates) {
      const key = keyOf(o);
      if (!shouldAlert(key, o.gapPct)) continue;

      await sendTelegramMessage(formatMessage(o));
      markAlerted(key, o.gapPct);
      sent++;
    }

    return NextResponse.json({
      checked: candidates.length,
      sent,
      threshold: alertThreshold,
      at: Date.now(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
