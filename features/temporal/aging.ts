// Pure temporal aging utilities — no I/O

export type AgeCategory = "fresh" | "active" | "aging" | "stale" | "dormant";

export interface AgingResult {
  category:   AgeCategory;
  daysSince:  number;
  label:      string;
  colorToken: string;
}

const THRESHOLDS = {
  fresh:   3,   // < 3 days
  active:  14,  // < 14 days
  aging:   30,  // < 30 days
  stale:   60,  // < 60 days
  // dormant: >= 60 days
} as const;

export function computeAge(updatedAt: Date | string, now = new Date()): AgingResult {
  const updated    = typeof updatedAt === "string" ? new Date(updatedAt) : updatedAt;
  const msPerDay   = 1000 * 60 * 60 * 24;
  const daysSince  = Math.floor((now.getTime() - updated.getTime()) / msPerDay);

  let category: AgeCategory;
  let label:    string;

  if (daysSince < THRESHOLDS.fresh) {
    category = "fresh";
    label    = daysSince === 0 ? "today" : daysSince === 1 ? "yesterday" : `${daysSince}d ago`;
  } else if (daysSince < THRESHOLDS.active) {
    category = "active";
    label    = `${daysSince}d ago`;
  } else if (daysSince < THRESHOLDS.aging) {
    category = "aging";
    label    = `${daysSince}d ago`;
  } else if (daysSince < THRESHOLDS.stale) {
    category = "stale";
    label    = `${Math.round(daysSince / 7)}w ago`;
  } else {
    category = "dormant";
    label    = `${Math.round(daysSince / 30)}mo ago`;
  }

  return {
    category,
    daysSince,
    label,
    colorToken: AGE_COLOR[category],
  };
}

export const AGE_COLOR: Record<AgeCategory, string> = {
  fresh:   "var(--color-success)",
  active:  "var(--color-text-muted)",
  aging:   "var(--color-warning)",
  stale:   "var(--color-error)",
  dormant: "var(--color-error)",
};

export function formatRelativeTime(date: Date | string, now = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = now.getTime() - d.getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  if (days < 30)  return `${Math.round(days / 7)}w ago`;
  return `${Math.round(days / 30)}mo ago`;
}

export function isStale(updatedAt: Date | string, thresholdDays = 14): boolean {
  return computeAge(updatedAt).daysSince >= thresholdDays;
}

export function agingScore(items: Array<{ updatedAt: Date | string }>): number {
  if (items.length === 0) return 0;
  const avg = items.reduce((sum, i) => sum + computeAge(i.updatedAt).daysSince, 0) / items.length;
  return Math.min(100, Math.round(avg));
}
