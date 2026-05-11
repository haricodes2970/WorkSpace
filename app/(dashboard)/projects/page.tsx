import type { Metadata } from "next";
import { requireAuthUser } from "@/services/auth.service";
import { ProjectsWorkspace } from "@/features/projects/components/projects-workspace";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  await requireAuthUser();

  // Phase 1: empty state — projectRepository.findAllByUser() wired in Phase 2
  return <ProjectsWorkspace projects={[]} />;
}
