"use client";

// Lightweight recent-action store — no external deps, localStorage-backed.
// Stores the last 8 navigated entities for "Continue where you left off" in command palette.

export interface RecentItem {
  id:        string;
  label:     string;
  sublabel?: string;
  href:      string;
  type:      "idea" | "project" | "knowledge" | "page";
  visitedAt: number; // epoch ms
}

const KEY      = "ws:recent-items";
const MAX_KEEP = 8;

function load(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as RecentItem[];
  } catch {
    return [];
  }
}

function save(items: RecentItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function pushRecentItem(item: Omit<RecentItem, "visitedAt">): void {
  const items = load().filter((i) => i.id !== item.id);
  save([{ ...item, visitedAt: Date.now() }, ...items].slice(0, MAX_KEEP));
}

export function getRecentItems(): RecentItem[] {
  return load().sort((a, b) => b.visitedAt - a.visitedAt);
}

export function clearRecentItems(): void {
  save([]);
}
