type AlertRecord = { lastSentAt: number; lastGapPct: number };

// Module-level Map survives across warm invocations of the same serverless
// instance, but NOT across cold starts or multiple concurrent instances.
// Good enough to avoid spamming the same opportunity every minute; not a
// durable dedup store. For guaranteed once-only alerts across restarts,
// swap this for Vercel KV / Upstash Redis (see README).
const state = new Map<string, AlertRecord>();

const COOLDOWN_MS = 30 * 60 * 1000; // don't re-alert same route within 30 min...
const RE_ALERT_GAP_JUMP = 0.5; // ...unless the gap grew by this many extra points

export function shouldAlert(key: string, gapPct: number): boolean {
  const prev = state.get(key);
  if (!prev) return true;
  const cooledDown = Date.now() - prev.lastSentAt > COOLDOWN_MS;
  const gapJumped = gapPct - prev.lastGapPct >= RE_ALERT_GAP_JUMP;
  return cooledDown || gapJumped;
}

export function markAlerted(key: string, gapPct: number) {
  state.set(key, { lastSentAt: Date.now(), lastGapPct: gapPct });
}
