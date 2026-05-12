"use server";

import { requireSession } from "@/lib/auth/get-session";
import { getAmbientSurface } from "@/features/ambient/ambient.service";

export async function getAmbientSurfaceAction() {
  const session = await requireSession();
  return getAmbientSurface(session.profile.id);
}
