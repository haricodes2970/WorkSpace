"use client";

import {
  createContext, useContext, useEffect, useCallback, useRef, useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  track, flushBuffer, aggregateEvents, loadPersistedEvents, clearPersistedEvents,
  startAutoFlush, stopAutoFlush,
} from "@/platform/telemetry/usage-tracker";
import {
  loadAdaptationWeights, saveAdaptationWeights, mergeWeights,
} from "@/platform/adaptation/adaptation-store";
import {
  recordVisit, warmTopCandidates,
} from "@/platform/optimization/prefetch-registry";
import { enqueueEntityWarm, warmEntitiesOnIdle } from "@/platform/optimization/entity-warmer";
import {
  syncUsageAction, getAdaptationWeightsAction,
} from "@/features/adaptive/actions/adaptive-actions";
import {
  DEFAULT_ADAPTATION_WEIGHTS, type AdaptationWeights,
} from "@/platform/telemetry/telemetry-types";

interface AdaptiveContextValue {
  weights:      AdaptationWeights;
  trackNav:     (route: string) => void;
  trackCmd:     (cmdId: string) => void;
  trackEntity:  (kind: string, id: string) => void;
  trackCreate:  (kind: string) => void;
  forceSync:    () => Promise<void>;
  isAdapted:    boolean;   // true once server weights have been applied
}

const AdaptiveContext = createContext<AdaptiveContextValue | null>(null);

const SYNC_INTERVAL = 5 * 60 * 1000; // sync every 5 min

export function AdaptiveProvider({ children }: { children: ReactNode }) {
  const pathname   = usePathname();
  const router     = useRouter();
  const [weights, setWeights]   = useState<AdaptationWeights>(DEFAULT_ADAPTATION_WEIGHTS);
  const [isAdapted, setAdapted] = useState(false);
  const syncTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate weights from localStorage on mount, then fetch from server
  useEffect(() => {
    const local = loadAdaptationWeights();
    if (local) { setWeights(local); setAdapted(true); }

    getAdaptationWeightsAction()
      .then(({ weights: serverWeights }) => {
        if (!serverWeights) return;
        const merged = mergeWeights(local, serverWeights);
        setWeights(merged);
        saveAdaptationWeights(merged);
        setAdapted(true);
      })
      .catch(console.error);

    startAutoFlush();
    return () => stopAutoFlush();
  }, []);

  // Track route changes
  useEffect(() => {
    track("nav", pathname);
    recordVisit(pathname);
    warmTopCandidates(router, 3);
    warmEntitiesOnIdle();
  }, [pathname, router]);

  const doSync = useCallback(async () => {
    try {
      const events = [...loadPersistedEvents(), ...flushBuffer()];
      if (!events.length) return;
      const aggregate = aggregateEvents(events);
      const { weights: serverWeights } = await syncUsageAction(aggregate);
      const merged = mergeWeights(loadAdaptationWeights(), serverWeights);
      setWeights(merged);
      saveAdaptationWeights(merged);
      clearPersistedEvents();
      setAdapted(true);
    } catch { /* sync is best-effort */ }
  }, []);

  const scheduleSyncDebounced = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => doSync(), SYNC_INTERVAL);
  }, [doSync]);

  const trackNav    = useCallback((route: string)          => { track("nav",         route); scheduleSyncDebounced(); }, [scheduleSyncDebounced]);
  const trackCmd    = useCallback((cmdId: string)           => { track("cmd",         cmdId); scheduleSyncDebounced(); }, [scheduleSyncDebounced]);
  const trackEntity = useCallback((kind: string, id: string) => {
    track("entity_open", id, kind);
    enqueueEntityWarm(kind, id);
    scheduleSyncDebounced();
  }, [scheduleSyncDebounced]);
  const trackCreate = useCallback((kind: string)            => { track("create",      "", kind); scheduleSyncDebounced(); }, [scheduleSyncDebounced]);
  const forceSync   = useCallback(() => doSync(), [doSync]);

  return (
    <AdaptiveContext.Provider value={{ weights, trackNav, trackCmd, trackEntity, trackCreate, forceSync, isAdapted }}>
      {children}
    </AdaptiveContext.Provider>
  );
}

export function useAdaptive() {
  const ctx = useContext(AdaptiveContext);
  if (!ctx) throw new Error("useAdaptive must be used within AdaptiveProvider");
  return ctx;
}
