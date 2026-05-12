"use server";

import { requireSession } from "@/lib/auth/get-session";
import { getCognitionLoad } from "@/features/cognition/cognition.service";

export async function getCognitionLoadAction() {
  const session = await requireSession();
  return getCognitionLoad(session.profile.id);
}
