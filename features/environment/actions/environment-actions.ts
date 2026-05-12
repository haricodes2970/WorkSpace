"use server";

import { requireSession } from "@/lib/auth/get-session";
import { getEnvironmentHealth } from "@/features/environment/environment.service";

export async function getEnvironmentHealthAction() {
  const session = await requireSession();
  return getEnvironmentHealth(session.profile.id);
}
