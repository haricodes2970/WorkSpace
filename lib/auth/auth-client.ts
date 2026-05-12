"use client";

// Client-side auth helpers — browser only, never import in server components

import { createClient } from "@/lib/supabase/client";
import { getCallbackUrl } from "./auth-redirect";

export async function signInWithGoogle(): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getCallbackUrl("/callback"),
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
  if (error) throw new Error(error.message);
  // Supabase auto-redirects to Google OAuth page
}

export async function getClientSession() {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}
