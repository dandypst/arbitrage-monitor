import { Opportunity } from "@/lib/types";

function label(o: Opportunity): string {
  if (o.kind === "cross-chain") {
    return `${o.symbol} · ${o.chainLow}→${o.chainHigh}`;
  }
  return `${o.pair} · ${o.dexLow}→${o.dexHigh} (${o.chain})`;
}

export default function Ticker({ items }: { items: Opportunity[] }) {
  if (items.length === 0) {
    return (
      <div className="border-b border-panelBorder bg-panel py-2 px-4 font-mono text-xs text-mute">
        no gaps above threshold right now
      </div>
    );
  }

  // Duplicate the list so the CSS scroll loop is seamless
  const loop = [...items, ...items];

  return (
    <div className="overflow-hidden border-b border-panelBorder bg-panel">
      <div className="ticker-track flex w-max gap-8 py-2">
        {loop.map((o, i) => (
          <span
            key={i}
            className="flex items-center gap-2 whitespace-nowrap px-4 font-mono text-xs"
          >
            <span className="text-mute">{label(o)}</span>
            <span
              className={
                o.gapPct >= 1 ? "text-signal font-bold" : "text-signal"
              }
            >
              +{o.gapPct.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
