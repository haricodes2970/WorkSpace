"use client";

/**
 * useDraft — React hook for IndexedDB-backed draft persistence.
 * Debounced auto-save. Loads draft on mount. Clears on explicit save/discard.
 *
 * Usage:
 *   const { hasDraft, loadDraftData, saveDraftData, discardDraft } = useDraft("idea:new");
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { saveDraft, loadDraft, clearDraft, pruneExpiredDrafts } from "./draft-store";

const DEBOUNCE_MS = 1200;

interface UseDraftOptions {
  debounce?: number;
}

interface UseDraftResult<T> {
  hasDraft:      boolean;
  draftSavedAt:  number | null;
  loadDraftData: () => Promise<T | null>;
  saveDraftData: (data: T) => void;      // debounced
  flushDraft:    (data: T) => Promise<void>; // immediate
  discardDraft:  () => Promise<void>;
}

export function useDraft<T>(key: string, opts?: UseDraftOptions): UseDraftResult<T> {
  const [hasDraft, setHasDraft]         = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounce = opts?.debounce ?? DEBOUNCE_MS;

  // Check for existing draft on mount and prune expired
  useEffect(() => {
    let mounted = true;
    void pruneExpiredDrafts();
    void loadDraft(key).then((draft) => {
      if (!mounted) return;
      if (draft) {
        setHasDraft(true);
        setDraftSavedAt(draft.savedAt);
      }
    });
    return () => { mounted = false; };
  }, [key]);

  const loadDraftData = useCallback(async (): Promise<T | null> => {
    const draft = await loadDraft<T>(key);
    return draft?.data ?? null;
  }, [key]);

  const flushDraft = useCallback(async (data: T): Promise<void> => {
    await saveDraft(key, data);
    setHasDraft(true);
    setDraftSavedAt(Date.now());
  }, [key]);

  const saveDraftData = useCallback((data: T): void => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void flushDraft(data);
    }, debounce);
  }, [flushDraft, debounce]);

  const discardDraft = useCallback(async (): Promise<void> => {
    if (timerRef.current) clearTimeout(timerRef.current);
    await clearDraft(key);
    setHasDraft(false);
    setDraftSavedAt(null);
  }, [key]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { hasDraft, draftSavedAt, loadDraftData, saveDraftData, flushDraft, discardDraft };
}
