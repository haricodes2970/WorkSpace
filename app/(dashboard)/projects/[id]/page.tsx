import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuthUser } from "@/services/auth.service";
import { ProjectCommandCenter } from "@/features/projects/components/project-command-center";

export const metadata: Metadata = { title: "Project" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  await requireAuthUser();

  // Phase 1: placeholder — replace with projectRepository.findByIdWithRelations(id, profile.id)
  if (id === "new") {
    return (
      <ProjectCommandCenter
        project={{
          id: "new",
          title: "New Project",
          description: null,
          status: "PLANNING",
          tags: [],
          targetDate: null,
          shippedAt: null,
          updatedAt: new Date(),
          linkedIdeaId: null,
          linkedIdeaTitle: null,
          tasks: [],
          milestones: [],
          notes: [],
          links: [],
        }}
        onAddTask={() => {}}
        onShip={() => {}}
      />
    );
  }

  // Real data fetching — Phase 2
  notFound();
}
