import { NextResponse, type NextRequest } from "next/server";

// Legacy alias — preserves old Supabase email links and external bookmarks.
// All real callback logic lives at app/(auth)/callback/route.ts → /callback.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const params = searchParams.toString();
  return NextResponse.redirect(
    `${origin}/callback${params ? `?${params}` : ""}`,
    { status: 301 }
  );
}
