"use client";

// Entity warmer — tracks recently accessed entities and prefetches their API
// data by triggering lightweight fetch during idle time via requestIdleCallback

const WARM_KEY   = "ws:entity-warm-queue";
const MAX_QUEUE  = 15;
const WARM_LIMIT = 3;   // warm at most 3 entities per idle tick

export interface WarmEntry {
  kind:  string;
  id:    string;
  score: number;
  warmedAt?: number;
}

function load(): WarmEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WARM_KEY);
    return raw ? (JSON.parse(raw) as WarmEntry[]) : [];
  } catch { return []; }
}

function save(q: WarmEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WARM_KEY, JSON.stringify(q));
}

export function enqueueEntityWarm(kind: string, id: string): void {
  const queue    = load();
  const existing = queue.find((e) => e.kind === kind && e.id === id);
  if (existing) {
    existing.score += 1;
  } else {
    queue.push({ kind, id, score: 1 });
  }
  save(queue.sort((a, b) => b.score - a.score).slice(0, MAX_QUEUE));
}

// Warm entities during idle time — fetch /api/warm/<kind>/<id>
// The API route can be a no-op that just triggers Next.js cache fill
export function warmEntitiesOnIdle(): void {
  if (typeof window === "undefined") return;
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
  const schedule = ric
    ? (cb: () => void) => ric(cb)
    : (cb: () => void) => setTimeout(cb, 200);

  schedule(() => {
    const queue = load();
    const now   = Date.now();
    const STALE = 10 * 60 * 1000;
    let warmed  = 0;

    for (const entry of queue) {
      if (warmed >= WARM_LIMIT) break;
      const needsWarm = !entry.warmedAt || (now - entry.warmedAt) > STALE;
      if (needsWarm) {
        fetch(`/api/warm/${entry.kind}/${entry.id}`, { method: "GET", priority: "low" as RequestPriority })
          .catch(() => { /* silently ignore warm failures */ });
        entry.warmedAt = now;
        warmed++;
      }
    }

    if (warmed > 0) save(queue);
  });
}
