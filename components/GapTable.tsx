import { Opportunity } from "@/lib/types";

function gapColor(pct: number) {
  if (pct >= 2) return "text-signal";
  if (pct >= 1) return "text-amber";
  return "text-ink";
}

export default function GapTable({
  title,
  subtitle,
  items,
  emptyHint,
}: {
  title: string;
  subtitle: string;
  items: Opportunity[];
  emptyHint: string;
}) {
  return (
    <div className="flex-1 rounded-lg border border-panelBorder bg-panel">
      <div className="border-b border-panelBorder px-5 py-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          {title}
        </h2>
        <p className="text-xs text-mute">{subtitle}</p>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-mute">
          {emptyHint}
        </div>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-panelBorder text-xs uppercase tracking-wide text-mute">
              <th className="px-5 py-2 font-medium">Asset</th>
              <th className="px-5 py-2 font-medium">Route</th>
              <th className="px-5 py-2 font-medium text-right">Low</th>
              <th className="px-5 py-2 font-medium text-right">High</th>
              <th className="px-5 py-2 font-medium text-right">Gap</th>
            </tr>
          </thead>
          <tbody className="font-mono tabular">
            {items.map((o, i) => (
              <tr
                key={i}
                className="border-b border-panelBorder/50 last:border-0 hover:bg-white/[0.02]"
              >
                <td className="px-5 py-3 font-body text-ink">
                  {o.kind === "cross-chain" ? o.symbol : o.pair}
                </td>
                <td className="px-5 py-3 text-mute">
                  {o.kind === "cross-chain"
                    ? `${o.chainLow} → ${o.chainHigh}`
                    : `${o.dexLow} → ${o.dexHigh} (${o.chain})`}
                </td>
                <td className="px-5 py-3 text-right text-ink">
                  ${o.priceLow.toFixed(4)}
                </td>
                <td className="px-5 py-3 text-right text-ink">
                  ${o.priceHigh.toFixed(4)}
                </td>
                <td className={`px-5 py-3 text-right font-bold ${gapColor(o.gapPct)}`}>
                  +{o.gapPct.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
