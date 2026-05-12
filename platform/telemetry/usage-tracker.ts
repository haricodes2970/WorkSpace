"use client";

// Client-side usage event accumulator
// Buffers events in memory, flushes to localStorage every FLUSH_INTERVAL ms
// Synced to DB by AdaptiveContext on session end / navigation

import type { TelemetryEvent, TelemetryEventKind, UsageAggregate } from "./telemetry-types";

const BUFFER_KEY   = "ws:telemetry-buffer";
const FLUSH_INTERVAL = 30_000; // 30s
let   flushTimer: ReturnType<typeof setInterval> | null = null;

let buffer: TelemetryEvent[] = [];

// Session id — reset per page load
const SESSION_ID = Math.random().toString(36).slice(2, 10);

export function isoWeek(d = new Date()): string {
  const jan1   = new Date(d.getFullYear(), 0, 1);
  const week   = Math.ceil(((d.getTime() - jan1.getTime()) / 86_400_000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function track(kind: TelemetryEventKind, target: string, entityKind?: string): void {
  if (typeof window === "undefined") return;
  buffer.push({ kind, target, entityKind, ts: Date.now(), sessionId: SESSION_ID });
}

export function flushBuffer(): TelemetryEvent[] {
  const flushed = [...buffer];
  buffer = [];
  persistFlushed(flushed);
  return flushed;
}

function persistFlushed(events: TelemetryEvent[]): void {
  if (!events.length || typeof window === "undefined") return;
  try {
    const existing = loadPersistedEvents();
    const combined = [...existing, ...events].slice(-500); // cap at 500 events
    localStorage.setItem(BUFFER_KEY, JSON.stringify(combined));
  } catch { /* storage full — silently drop */ }
}

export function loadPersistedEvents(): TelemetryEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BUFFER_KEY);
    return raw ? (JSON.parse(raw) as TelemetryEvent[]) : [];
  } catch { return []; }
}

export function clearPersistedEvents(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BUFFER_KEY);
}

export function aggregateEvents(events: TelemetryEvent[]): UsageAggregate {
  const agg: UsageAggregate = {
    navCounts:       {},
    cmdCounts:       {},
    entityAccess:    {},
    searchQueries:   0,
    deepWorkMinutes: 0,
    focusToggles:    0,
    createCounts:    {},
    sessionCount:    new Set(events.map((e) => e.sessionId)).size,
    period:          isoWeek(),
  };

  for (const e of events) {
    switch (e.kind) {
      case "nav":
        agg.navCounts[e.target] = (agg.navCounts[e.target] ?? 0) + 1;
        break;
      case "cmd":
        agg.cmdCounts[e.target] = (agg.cmdCounts[e.target] ?? 0) + 1;
        break;
      case "entity_open":
        if (e.entityKind) {
          const key = `${e.entityKind}:${e.target}`;
          agg.entityAccess[key] = (agg.entityAccess[key] ?? 0) + 1;
        }
        break;
      case "search":
        agg.searchQueries += 1;
        break;
      case "deep_work":
        agg.deepWorkMinutes += 1;
        break;
      case "focus_toggle":
        agg.focusToggles += 1;
        break;
      case "create":
        if (e.entityKind) {
          agg.createCounts[e.entityKind] = (agg.createCounts[e.entityKind] ?? 0) + 1;
        }
        break;
    }
  }
  return agg;
}

export function startAutoFlush(): void {
  if (typeof window === "undefined" || flushTimer) return;
  flushTimer = setInterval(() => flushBuffer(), FLUSH_INTERVAL);
}

export function stopAutoFlush(): void {
  if (flushTimer) { clearInterval(flushTimer); flushTimer = null; }
}
