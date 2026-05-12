"use client";

import { useRef, useEffect, useCallback, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export interface UseAutosaveReturn {
  status: AutosaveStatus;
  error: Error | null;
  saveNow: () => void;
}

interface UseAutosaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  /** Debounce delay in ms. Default: 1000 */
  debounceMs?: number;
  /** Max exponential backoff retries. Default: 3 */
  maxRetries?: number;
  /** Whether autosave is active. Default: true */
  enabled?: boolean;
}

export function useAutosave<T>({
  data,
  onSave,
  debounceMs = 1000,
  maxRetries = 3,
  enabled = true,
}: UseAutosaveOptions<T>): UseAutosaveReturn {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [error, setError]   = useState<Error | null>(null);

  const dataRef      = useRef(data);
  const onSaveRef    = useRef(onSave);
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef     = useRef(0);
  const mountedRef   = useRef(true);

  dataRef.current   = data;
  onSaveRef.current = onSave;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const attemptSave = useCallback(async (attempt = 0) => {
    if (!mountedRef.current) return;
    setStatus("saving");
    setError(null);
    try {
      await onSaveRef.current(dataRef.current);
      if (!mountedRef.current) return;
      retryRef.current = 0;
      setStatus("saved");
      // Reset to idle after 2s
      setTimeout(() => {
        if (mountedRef.current) setStatus("idle");
      }, 2000);
    } catch (err) {
      if (!mountedRef.current) return;
      const e = err instanceof Error ? err : new Error("Save failed");
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        timerRef.current = setTimeout(() => attemptSave(attempt + 1), delay);
      } else {
        retryRef.current = 0;
        setStatus("error");
        setError(e);
      }
    }
  }, [maxRetries]);

  // Debounced save on data change
  useEffect(() => {
    if (!enabled) return;
    if (status === "saving") return; // don't interrupt in-flight save

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => attemptSave(0), debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, enabled, debounceMs]);

  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    void attemptSave(0);
  }, [attemptSave]);

  return { status, error, saveNow };
}
