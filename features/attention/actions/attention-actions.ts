"use server";

import { requireSession } from "@/lib/auth/get-session";
import { getAttentionProfile } from "@/features/attention/attention.service";

export async function getAttentionProfileAction() {
  const session = await requireSession();
  return getAttentionProfile(session.profile.id);
}
