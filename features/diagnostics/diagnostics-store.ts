"use client";

// Lightweight client-side metrics store.
// Tracks save latency, search latency, command palette open time.
// Accessible via ⌘⌥D in development.

export interface Metric {
  name:      string;
  value:     number;  // ms or count
  unit:      "ms" | "count";
  timestamp: number;
}

const MAX_HISTORY = 50;
let metrics: Metric[] = [];
const listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

export function trackMetric(name: string, value: number, unit: Metric["unit"] = "ms"): void {
  metrics = [{ name, value, unit, timestamp: Date.now() }, ...metrics].slice(0, MAX_HISTORY);
  notify();
}

export function trackLatency(name: string, startMs: number): void {
  trackMetric(name, Date.now() - startMs, "ms");
}

export function getMetrics(): Metric[] {
  return metrics;
}

export function getAverageLatency(name: string): number | null {
  const matches = metrics.filter((m) => m.name === name && m.unit === "ms");
  if (matches.length === 0) return null;
  return Math.round(matches.reduce((s, m) => s + m.value, 0) / matches.length);
}

export function clearMetrics(): void {
  metrics = [];
  notify();
}

export function subscribeToDiagnostics(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Convenience: time an async fn
export async function timed<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    trackLatency(name, start);
  }
}
