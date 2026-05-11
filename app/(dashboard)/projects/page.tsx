import type { Metadata } from "next";
import { requireAuthUser } from "@/services/auth.service";
import { projectRepository } from "@/repositories/project.repository";
import { ProjectsWorkspace } from "@/features/projects/components/projects-workspace";
import type { ProjectListItem } from "@/features/projects/components/projects-workspace";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const { profile } = await requireAuthUser();

  const raw = await projectRepository.findAllByUser(profile.id);

  const projects: ProjectListItem[] = raw.map((p) => ({
    id:             p.id,
    title:          p.title,
    description:    p.description,
    status:         p.status,
    executionState: p.executionState,
    momentumScore:  p.momentumScore,
    tags:           p.tags ?? [],
    taskTotal:      p.tasks.length,
    taskDone:       p.tasks.filter((t) => t.status === "DONE").length,
    targetDate:     p.targetDate ?? null,
    updatedAt:      p.updatedAt,
    linkedIdeaTitle: p.idea?.title ?? null,
  }));

  return <ProjectsWorkspace projects={projects} />;
}
