import "server-only";
import type { User } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEV_USER_ID   = "00000000-0000-0000-0000-000000000001";
export const DEV_AUTH_ID   = "00000000-0000-0000-0000-000000000002";
export const DEV_USER_EMAIL = "dev@workspace.local";

// ─── Guard ────────────────────────────────────────────────────────────────────

/**
 * Double-gated: NODE_ENV must be "development" AND DEV_AUTH_BYPASS must be "true".
 * Production can never satisfy both conditions regardless of env var misconfig.
 */
export function isDevAuthEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_AUTH_BYPASS === "true"
  );
}

// ─── Mock Prisma user ─────────────────────────────────────────────────────────

export const DEV_PRISMA_USER: User = {
  id:        DEV_USER_ID,
  authId:    DEV_AUTH_ID,
  email:     DEV_USER_EMAIL,
  name:      "Developer",
  avatarUrl: null,
  timezone:  "UTC",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  deletedAt: null,
};

// ─── Mock Supabase user ───────────────────────────────────────────────────────

export const DEV_SUPABASE_USER: SupabaseUser = {
  id:                    DEV_AUTH_ID,
  aud:                   "authenticated",
  role:                  "authenticated",
  email:                 DEV_USER_EMAIL,
  email_confirmed_at:    "2024-01-01T00:00:00.000Z",
  confirmed_at:          "2024-01-01T00:00:00.000Z",
  last_sign_in_at:       "2024-01-01T00:00:00.000Z",
  app_metadata:          { provider: "email", providers: ["email"] },
  user_metadata:         { name: "Developer" },
  identities:            [],
  created_at:            "2024-01-01T00:00:00.000Z",
  updated_at:            "2024-01-01T00:00:00.000Z",
  is_anonymous:          false,
  phone:                 "",
};
