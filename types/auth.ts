import type { User as PrismaUser } from "@prisma/client";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

export interface AuthUser {
  supabase: SupabaseUser;
  profile: PrismaUser;
}

export interface AuthSession {
  user: AuthUser;
  session: Session;
}

export type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: AuthUser }
  | { status: "unauthenticated" };
