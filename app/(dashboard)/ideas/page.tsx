import type { Metadata } from "next";
import { requireAuthUser } from "@/services/auth.service";
import { IdeasWorkspace } from "@/features/ideas/components/ideas-workspace";

export const metadata: Metadata = { title: "Ideas" };

export default async function IdeasPage() {
  await requireAuthUser();

  // Phase 1: empty state — ideaRepository.findAllByUser() wired in Phase 2
  return <IdeasWorkspace ideas={[]} />;
}
