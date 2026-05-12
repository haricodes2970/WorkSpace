"use server";

import { requireSession } from "@/lib/auth/get-session";
import { getBuilderProfile } from "@/features/builder-profile/builder-profile.service";

export async function getBuilderProfileAction() {
  const session = await requireSession();
  return getBuilderProfile(session.profile.id);
}
