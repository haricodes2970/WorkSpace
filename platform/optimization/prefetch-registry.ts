"use client";

// Predictive prefetch registry — tracks hot routes and warms them via router.prefetch
// Runs silently, never blocking, never intrusive

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

const PREFETCH_KEY = "ws:prefetch-candidates";
const MAX_CANDIDATES = 10;

export interface PrefetchCandidate {
  href:       string;
  score:      number;   // higher = more likely to be visited
  prefetchedAt?: number;
}

// Load candidates from localStorage
function loadCandidates(): PrefetchCandidate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PREFETCH_KEY);
    return raw ? (JSON.parse(raw) as PrefetchCandidate[]) : [];
  } catch { return []; }
}

function saveCandidates(candidates: PrefetchCandidate[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFETCH_KEY, JSON.stringify(candidates));
}

// Record a visit — increases score for next-likely routes
export function recordVisit(route: string): void {
  const candidates = loadCandidates();
  const NEXT_ROUTES = inferNextRoutes(route);

  for (const next of NEXT_ROUTES) {
    const existing = candidates.find((c) => c.href === next);
    if (existing) {
      existing.score += 1;
    } else {
      candidates.push({ href: next, score: 1 });
    }
  }

  saveCandidates(
    candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_CANDIDATES)
  );
}

// Infer likely next routes based on current route
function inferNextRoutes(route: string): string[] {
  if (route === "/today")     return ["/projects", "/tasks", "/ideas"];
  if (route === "/dashboard") return ["/projects", "/today", "/advisor"];
  if (route === "/projects")  return ["/tasks", "/today"];
  if (route === "/ideas")     return ["/projects", "/knowledge"];
  if (route === "/knowledge") return ["/ideas", "/advisor"];
  if (route === "/advisor")   return ["/projects", "/reviews"];
  // For entity detail pages, prefetch parent list
  if (route.startsWith("/projects/")) return ["/projects", "/tasks"];
  if (route.startsWith("/ideas/"))    return ["/ideas"];
  return [];
}

// Warm top candidates via Next.js router prefetch
export function warmTopCandidates(
  router:    AppRouterInstance,
  maxWarm:   number = 3,
): void {
  const candidates = loadCandidates();
  const now        = Date.now();
  const STALE_MS   = 5 * 60 * 1000; // re-prefetch after 5 min

  let count = 0;
  for (const c of candidates) {
    if (count >= maxWarm) break;
    const stale = !c.prefetchedAt || (now - c.prefetchedAt) > STALE_MS;
    if (stale) {
      router.prefetch(c.href as `/${string}`);
      c.prefetchedAt = now;
      count++;
    }
  }

  if (count > 0) saveCandidates(candidates);
}
