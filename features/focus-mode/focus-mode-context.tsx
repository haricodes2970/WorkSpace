"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

interface FocusModeContextValue {
  focused:  boolean;
  toggle:   () => void;
  activate: () => void;
  deactivate: () => void;
}

const FocusModeContext = createContext<FocusModeContextValue>({
  focused:    false,
  toggle:     () => undefined,
  activate:   () => undefined,
  deactivate: () => undefined,
});

export function useFocusMode() {
  return useContext(FocusModeContext);
}

export function FocusModeProvider({ children }: { children: ReactNode }) {
  const [focused, setFocused] = useState(false);

  const activate   = useCallback(() => setFocused(true),  []);
  const deactivate = useCallback(() => setFocused(false), []);
  const toggle     = useCallback(() => setFocused((f) => !f), []);

  // Apply data-attribute to root so CSS can react
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-focus-mode",
      focused ? "true" : "false"
    );
  }, [focused]);

  // Keyboard shortcut: Ctrl/Cmd + Shift + F
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "f") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <FocusModeContext.Provider value={{ focused, toggle, activate, deactivate }}>
      {children}
    </FocusModeContext.Provider>
  );
}
