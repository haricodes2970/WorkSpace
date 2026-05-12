"use client";

import {
  createContext, useContext, useEffect, useState, useCallback, type ReactNode,
} from "react";
import type { AdaptationWeights } from "@/platform/telemetry/telemetry-types";

type Density = AdaptationWeights["density"];

const DENSITY_KEY = "ws:density";
const DENSITY_CSS: Record<Density, Record<string, string>> = {
  compact: {
    "--spacing-card":  "8px",
    "--spacing-panel": "12px",
    "--text-scale":    "0.95",
  },
  comfortable: {
    "--spacing-card":  "12px",
    "--spacing-panel": "16px",
    "--text-scale":    "1",
  },
  spacious: {
    "--spacing-card":  "20px",
    "--spacing-panel": "24px",
    "--text-scale":    "1.05",
  },
};

interface PersonalizationContextValue {
  density:    Density;
  setDensity: (d: Density) => void;
}

const PersonalizationContext = createContext<PersonalizationContextValue | null>(null);

export function PersonalizationProvider({ children }: { children: ReactNode }) {
  const [density, setDensityState] = useState<Density>("comfortable");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(DENSITY_KEY) as Density | null;
    if (stored && stored in DENSITY_CSS) applyDensity(stored);
    else setDensityState("comfortable");
  }, []);

  function applyDensity(d: Density) {
    setDensityState(d);
    if (typeof window === "undefined") return;
    const vars = DENSITY_CSS[d];
    for (const [k, v] of Object.entries(vars)) {
      document.documentElement.style.setProperty(k, v);
    }
    localStorage.setItem(DENSITY_KEY, d);
  }

  const setDensity = useCallback((d: Density) => applyDensity(d), []);

  return (
    <PersonalizationContext.Provider value={{ density, setDensity }}>
      {children}
    </PersonalizationContext.Provider>
  );
}

export function usePersonalization() {
  const ctx = useContext(PersonalizationContext);
  if (!ctx) throw new Error("usePersonalization must be within PersonalizationProvider");
  return ctx;
}
