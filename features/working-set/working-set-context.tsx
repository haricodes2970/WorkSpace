"use client";

import {
  createContext, useContext, useCallback, useState, useEffect,
  type ReactNode,
} from "react";
import {
  getWorkingSet, pinToWorkingSet, unpinFromWorkingSet,
  isInWorkingSet, clearWorkingSet, type WorkingSetEntry,
} from "@/lib/session-store";

interface WorkingSetContextValue {
  entries:   WorkingSetEntry[];
  pin:       (entry: Omit<WorkingSetEntry, "pinnedAt">) => void;
  unpin:     (entityKind: string, entityId: string) => void;
  isPinned:  (entityKind: string, entityId: string) => boolean;
  clear:     () => void;
  isOpen:    boolean;
  setOpen:   (v: boolean) => void;
}

const WorkingSetContext = createContext<WorkingSetContextValue | null>(null);

export function WorkingSetProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<WorkingSetEntry[]>([]);
  const [isOpen, setOpen]     = useState(false);

  const refresh = useCallback(() => setEntries(getWorkingSet()), []);

  useEffect(() => { refresh(); }, [refresh]);

  const pin = useCallback((entry: Omit<WorkingSetEntry, "pinnedAt">) => {
    pinToWorkingSet(entry);
    refresh();
  }, [refresh]);

  const unpin = useCallback((entityKind: string, entityId: string) => {
    unpinFromWorkingSet(entityKind, entityId);
    refresh();
  }, [refresh]);

  const isPinned = useCallback((entityKind: string, entityId: string) =>
    isInWorkingSet(entityKind, entityId), []);

  const clear = useCallback(() => {
    clearWorkingSet();
    refresh();
  }, [refresh]);

  return (
    <WorkingSetContext.Provider value={{ entries, pin, unpin, isPinned, clear, isOpen, setOpen }}>
      {children}
    </WorkingSetContext.Provider>
  );
}

export function useWorkingSet() {
  const ctx = useContext(WorkingSetContext);
  if (!ctx) throw new Error("useWorkingSet must be used within WorkingSetProvider");
  return ctx;
}
