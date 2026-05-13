"use client";

import {
  createContext, useContext, useEffect, useCallback, useRef, useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  getSession, setLastActive, setLastVisited,
  getWorkingSet, type WorkingSetEntry,
} from "@/lib/session-store";
import { syncSessionAction } from "@/features/continuity/actions/continuity-actions";

interface ContinuityContextValue {
  trackProject:    (projectId: string) => void;
  trackEntity:     (kind: string, id: string) => void;
  workingSet:      WorkingSetEntry[];
  refreshWorkingSet: () => void;
}

const ContinuityContext = createContext<ContinuityContextValue | null>(null);

export function ContinuityProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [workingSet, setWorkingSet] = useState<WorkingSetEntry[]>([]);

  const refreshWorkingSet = useCallback(() => {
    setWorkingSet(getWorkingSet());
  }, []);

  useEffect(() => {
    refreshWorkingSet();
  }, [refreshWorkingSet]);

  // Debounced DB sync — don't fire on every keystroke / nav
  const scheduleSync = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      const s = getSession();
      syncSessionAction({
        lastActiveProjectId:   s.lastActiveProjectId,
        lastVisitedEntityKind: s.lastVisitedEntityKind,
        lastVisitedEntityId:   s.lastVisitedEntityId,
        workingSet:            s.workingSet,
      }).catch(console.error);
    }, 3000);
  }, []);

  // Auto-track entity visits from URL
  useEffect(() => {
    const projectMatch = pathname.match(/^\/projects\/([^/]+)/);
    if (projectMatch && projectMatch[1] && projectMatch[1] !== "new") {
      setLastVisited("project", projectMatch[1]);
      scheduleSync();
    }
    const ideaMatch = pathname.match(/^\/ideas\/([^/]+)/);
    if (ideaMatch && ideaMatch[1] && ideaMatch[1] !== "new") {
      setLastVisited("idea", ideaMatch[1]);
      scheduleSync();
    }
  }, [pathname, scheduleSync]);

  const trackProject = useCallback((projectId: string) => {
    setLastActive(projectId);
    setLastVisited("project", projectId);
    scheduleSync();
  }, [scheduleSync]);

  const trackEntity = useCallback((kind: string, id: string) => {
    setLastVisited(kind, id);
    scheduleSync();
  }, [scheduleSync]);

  return (
    <ContinuityContext.Provider value={{ trackProject, trackEntity, workingSet, refreshWorkingSet }}>
      {children}
    </ContinuityContext.Provider>
  );
}

export function useContinuity() {
  const ctx = useContext(ContinuityContext);
  if (!ctx) throw new Error("useContinuity must be used within ContinuityProvider");
  return ctx;
}
