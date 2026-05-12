"use client";

import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DevUser {
  id:    string;
  email: string;
  name:  string;
}

interface DevAuthContextValue {
  user:            DevUser;
  isAuthenticated: true;
  logout:          () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const DevAuthContext = createContext<DevAuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface DevAuthProviderProps {
  children: ReactNode;
  user:     DevUser;
}

export function DevAuthProvider({ children, user }: DevAuthProviderProps) {
  const router = useRouter();

  const logout = useCallback(() => {
    // Dev logout: just navigate back to dev-login. No real session to clear.
    router.push("/dev-login");
  }, [router]);

  return (
    <DevAuthContext.Provider value={{ user, isAuthenticated: true, logout }}>
      {children}
    </DevAuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDevAuth(): DevAuthContextValue {
  const ctx = useContext(DevAuthContext);
  if (!ctx) throw new Error("useDevAuth must be used inside <DevAuthProvider>");
  return ctx;
}
