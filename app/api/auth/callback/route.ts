import { createClient } from "@/lib/supabase/server";
import { userRepository } from "@/repositories/user.repository";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/today";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      await userRepository.upsertByAuthId(data.user.id, {
        email: data.user.email!,
        name: (data.user.user_metadata?.["name"] as string) ?? null,
        avatarUrl: (data.user.user_metadata?.["avatar_url"] as string) ?? null,
        timezone: "UTC",
      });

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
