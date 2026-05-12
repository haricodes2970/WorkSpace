// Client-side telemetry types — all pure data, no side effects

export type TelemetryEventKind =
  | "nav"           // page navigation
  | "cmd"           // command palette action
  | "entity_open"   // entity detail opened
  | "search"        // search query issued
  | "deep_work"     // deep work session event
  | "focus_toggle"  // focus mode toggled
  | "working_set"   // pin/unpin action
  | "create"        // entity created
  | "quick_action"; // quick action triggered

export interface TelemetryEvent {
  kind:       TelemetryEventKind;
  target:     string;   // route, command id, entity id, query, etc.
  entityKind?: string;
  ts:         number;   // Date.now()
  sessionId:  string;   // short-lived session identifier
}

// Aggregated over a flush window (e.g. per-session or hourly)
export interface UsageAggregate {
  navCounts:      Record<string, number>;   // route → count
  cmdCounts:      Record<string, number>;   // command id → count
  entityAccess:   Record<string, number>;   // entityKind:id → count
  searchQueries:  number;
  deepWorkMinutes: number;
  focusToggles:   number;
  createCounts:   Record<string, number>;   // entityKind → count
  sessionCount:   number;
  period:         string;                   // ISO week "2026-W20"
}

export interface AdaptationWeights {
  // Nav item weights: href → weight (higher = more prominent)
  navWeights:    Record<string, number>;
  // Command weights: cmd id → weight
  cmdWeights:    Record<string, number>;
  // Preferred density: "compact" | "comfortable" | "spacious"
  density:       "compact" | "comfortable" | "spacious";
  // Preferred Today column order
  todayOrder:    string[];
  // Computed on last sync
  computedAt:    string;
  version:       number;
}

export const DEFAULT_ADAPTATION_WEIGHTS: AdaptationWeights = {
  navWeights:  {},
  cmdWeights:  {},
  density:     "comfortable",
  todayOrder:  ["builds", "tasks", "blockers"],
  computedAt:  new Date(0).toISOString(),
  version:     1,
};
