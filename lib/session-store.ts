"use client";

// Client-side session store — mirrors UserSession for optimistic continuity
// Synced to DB via session service on meaningful navigation events

export interface WorkingSetEntry {
  entityKind: string;
  entityId:   string;
  label:      string;
  href:       string;
  pinnedAt:   string; // ISO
}

export interface ClientSessionData {
  lastActiveProjectId?:   string;
  lastVisitedEntityKind?: string;
  lastVisitedEntityId?:   string;
  workingSet:             WorkingSetEntry[];
}

const SESSION_KEY = "ws:session";
const WORKING_SET_MAX = 6;

function read(): ClientSessionData {
  if (typeof window === "undefined") return { workingSet: [] };
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return { workingSet: [] };
    return JSON.parse(raw) as ClientSessionData;
  } catch {
    return { workingSet: [] };
  }
}

function write(data: ClientSessionData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function getSession(): ClientSessionData {
  return read();
}

export function setLastActive(projectId: string): void {
  write({ ...read(), lastActiveProjectId: projectId });
}

export function setLastVisited(entityKind: string, entityId: string): void {
  write({ ...read(), lastVisitedEntityKind: entityKind, lastVisitedEntityId: entityId });
}

// Working set ──────────────────────────────────────────────────────────────────

export function getWorkingSet(): WorkingSetEntry[] {
  return read().workingSet;
}

export function pinToWorkingSet(entry: Omit<WorkingSetEntry, "pinnedAt">): void {
  const session = read();
  const existing = session.workingSet.filter(
    (e) => !(e.entityKind === entry.entityKind && e.entityId === entry.entityId)
  );
  const next: WorkingSetEntry = { ...entry, pinnedAt: new Date().toISOString() };
  write({
    ...session,
    workingSet: [next, ...existing].slice(0, WORKING_SET_MAX),
  });
}

export function unpinFromWorkingSet(entityKind: string, entityId: string): void {
  const session = read();
  write({
    ...session,
    workingSet: session.workingSet.filter(
      (e) => !(e.entityKind === entityKind && e.entityId === entityId)
    ),
  });
}

export function isInWorkingSet(entityKind: string, entityId: string): boolean {
  return read().workingSet.some(
    (e) => e.entityKind === entityKind && e.entityId === entityId
  );
}

export function clearWorkingSet(): void {
  write({ ...read(), workingSet: [] });
}
