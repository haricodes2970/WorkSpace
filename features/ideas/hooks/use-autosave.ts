"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface UseAutosaveOptions<T> {
  value: T;
  onSave: (value: T) => Promise<void>;
  delay?: number;
  onError?: (err: unknown) => void;
}

export interface UseAutosaveResult {
  status: SaveStatus;
  lastSaved: Date | null;
  saveNow: () => Promise<void>;
}

export function useAutosave<T>({
  value,
  onSave,
  delay = 1200,
  onError,
}: UseAutosaveOptions<T>): UseAutosaveResult {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mountedRef = useRef(true);
  const valueRef = useRef(value);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    valueRef.current = value;
  });

  useEffect(() => {
    onSaveRef.current = onSave;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const performSave = useCallback(async () => {
    if (!mountedRef.current) return;
    setStatus("saving");
    try {
      await onSaveRef.current(valueRef.current);
      if (!mountedRef.current) return;
      setStatus("saved");
      setLastSaved(new Date());
      const resetTimer = setTimeout(() => {
        if (mountedRef.current) setStatus("idle");
      }, 2500);
      return () => clearTimeout(resetTimer);
    } catch (err) {
      if (!mountedRef.current) return;
      setStatus("error");
      onError?.(err);
    }
  }, [onError]);

  // Debounced autosave when value changes
  useEffect(() => {
    clearTimeout(timerRef.current);
    setStatus("saving");
    timerRef.current = setTimeout(performSave, delay);
    return () => clearTimeout(timerRef.current);
  }, [value, delay, performSave]);

  const saveNow = useCallback(async () => {
    clearTimeout(timerRef.current);
    await performSave();
  }, [performSave]);

  return { status, lastSaved, saveNow };
}
