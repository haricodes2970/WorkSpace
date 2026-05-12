"use client";

// Client-side adaptation weight store
// Weights are computed server-side and pushed down; client reads them for rendering

import type { AdaptationWeights } from "@/platform/telemetry/telemetry-types";

const WEIGHTS_KEY = "ws:adaptation-weights";

export function loadAdaptationWeights(): AdaptationWeights | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(WEIGHTS_KEY);
    return raw ? (JSON.parse(raw) as AdaptationWeights) : null;
  } catch { return null; }
}

export function saveAdaptationWeights(w: AdaptationWeights): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WEIGHTS_KEY, JSON.stringify(w));
}

export function clearAdaptationWeights(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(WEIGHTS_KEY);
}

// Merge server weights into local — server weights win on conflict
export function mergeWeights(
  local:  AdaptationWeights | null,
  server: AdaptationWeights
): AdaptationWeights {
  if (!local || server.version >= local.version) return server;
  return local;
}
