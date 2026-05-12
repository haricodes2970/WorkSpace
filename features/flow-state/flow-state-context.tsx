"use client";

import {
  createContext, useContext, useState, useCallback, useEffect, useRef,
  type ReactNode,
} from "react";

export type FlowIntensity = "idle" | "warm" | "flow" | "deep";

interface FlowStateContextValue {
  intensity:          FlowIntensity;
  activeMinutes:      number;
  streak:             number;      // consecutive days with activity
  lastActionAt:       Date | null;
  recordAction:       () => void;  // call on meaningful user action
  resetFlow:          () => void;
}

const FlowStateContext = createContext<FlowStateContextValue | null>(null);

const FLOW_KEY   = "ws:flow-state";
const WARM_MS    = 3  * 60 * 1000;   // 3 min
const FLOW_MS    = 15 * 60 * 1000;   // 15 min
const DEEP_MS    = 45 * 60 * 1000;   // 45 min
const IDLE_AFTER = 10 * 60 * 1000;   // idle after 10 min inactivity

interface PersistedFlow {
  activeMinutes: number;
  streak:        number;
  lastActionAt:  string;
  lastDayKey:    string;
}

function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function loadPersisted(): PersistedFlow | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FLOW_KEY);
    return raw ? (JSON.parse(raw) as PersistedFlow) : null;
  } catch { return null; }
}

function savePersisted(data: PersistedFlow) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FLOW_KEY, JSON.stringify(data));
}

export function FlowStateProvider({ children }: { children: ReactNode }) {
  const [intensity, setIntensity]       = useState<FlowIntensity>("idle");
  const [activeMinutes, setActiveMinutes] = useState(0);
  const [streak, setStreak]             = useState(0);
  const [lastActionAt, setLastActionAt] = useState<Date | null>(null);
  const sessionStartRef = useRef<Date | null>(null);
  const idleTimer       = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from localStorage
  useEffect(() => {
    const p = loadPersisted();
    if (!p) return;
    setActiveMinutes(p.activeMinutes);
    setStreak(p.streak);
    const last = new Date(p.lastActionAt);
    setLastActionAt(last);
  }, []);

  // Tick active minutes while not idle
  useEffect(() => {
    if (intensity === "idle" || !sessionStartRef.current) return;
    const interval = setInterval(() => {
      const mins = Math.floor((Date.now() - sessionStartRef.current!.getTime()) / 60_000);
      setActiveMinutes((prev) => {
        const next = prev + 1;
        const p = loadPersisted();
        if (p) savePersisted({ ...p, activeMinutes: next });
        return next;
      });
      // Update intensity based on session duration
      if      (mins >= DEEP_MS / 60_000) setIntensity("deep");
      else if (mins >= FLOW_MS / 60_000) setIntensity("flow");
      else if (mins >= WARM_MS / 60_000) setIntensity("warm");
    }, 60_000);
    return () => clearInterval(interval);
  }, [intensity]);

  const recordAction = useCallback(() => {
    const now = new Date();
    setLastActionAt(now);

    // Start session if needed
    if (!sessionStartRef.current || intensity === "idle") {
      sessionStartRef.current = now;
      setIntensity("warm");
    }

    // Update streak
    const today = dayKey(now);
    const p = loadPersisted();
    const prevDay = p?.lastDayKey;
    const prevDate = prevDay ? new Date(p!.lastActionAt) : null;
    const yesterday = prevDate ? dayKey(new Date(prevDate.getTime() + 86_400_000)) : null;

    let newStreak = streak;
    if (prevDay && prevDay !== today && yesterday !== today) {
      newStreak = 1; // streak broken
    } else if (!prevDay || prevDay !== today) {
      newStreak = (streak || 0) + 1;
    }
    setStreak(newStreak);
    savePersisted({ activeMinutes, streak: newStreak, lastActionAt: now.toISOString(), lastDayKey: today });

    // Reset idle timer
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      setIntensity("idle");
      sessionStartRef.current = null;
    }, IDLE_AFTER);
  }, [intensity, streak, activeMinutes]);

  const resetFlow = useCallback(() => {
    setIntensity("idle");
    sessionStartRef.current = null;
    if (idleTimer.current) clearTimeout(idleTimer.current);
  }, []);

  return (
    <FlowStateContext.Provider value={{ intensity, activeMinutes, streak, lastActionAt, recordAction, resetFlow }}>
      {children}
    </FlowStateContext.Provider>
  );
}

export function useFlowState() {
  const ctx = useContext(FlowStateContext);
  if (!ctx) throw new Error("useFlowState must be used within FlowStateProvider");
  return ctx;
}
