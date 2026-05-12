"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

interface DeepWorkSession {
  projectId: string;
  projectTitle: string;
  focus: string;
  startedAt: Date;
}

interface DeepWorkContextValue {
  session: DeepWorkSession | null;
  isActive: boolean;
  enter: (projectId: string, projectTitle: string, focus: string) => void;
  exit: () => void;
  elapsed: number; // seconds
}

const DeepWorkContext = createContext<DeepWorkContextValue | null>(null);

export function DeepWorkProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<DeepWorkSession | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!session) { setElapsed(0); return; }
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - session.startedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [session]);

  // Block navigation while session active
  useEffect(() => {
    if (!session) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [session]);

  const enter = useCallback((projectId: string, projectTitle: string, focus: string) => {
    setSession({ projectId, projectTitle, focus, startedAt: new Date() });
  }, []);

  const exit = useCallback(() => {
    setSession(null);
    setElapsed(0);
  }, []);

  return (
    <DeepWorkContext.Provider value={{ session, isActive: session !== null, enter, exit, elapsed }}>
      {children}
    </DeepWorkContext.Provider>
  );
}

export function useDeepWork() {
  const ctx = useContext(DeepWorkContext);
  if (!ctx) throw new Error("useDeepWork must be used inside DeepWorkProvider");
  return ctx;
}
