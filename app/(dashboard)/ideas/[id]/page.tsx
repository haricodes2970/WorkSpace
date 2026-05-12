import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireAuthUser } from "@/services/auth.service";
import { ideaRepository } from "@/repositories/idea.repository";
import { ideaBlockRepository, ideaRelationshipRepository } from "@/features/ideas/repositories/idea-block.repository";
import { IdeaEditor } from "@/features/ideas/components/idea-editor";
import { saveBlockAction } from "@/features/ideas/actions/block-actions";
import { convertIdeaAction } from "@/features/ideas/actions/conversion-actions";
import type { BlockEditorBlock } from "@/features/ideas/hooks/use-block-editor";
import type { IdeaRelationshipItem } from "@/features/ideas/components/relationships-panel";
import type { ConversionConfig } from "@/features/ideas/conversion/conversion-gate";
import type { BlockType } from "@prisma/client";

export const metadata: Metadata = { title: "Idea" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function IdeaDetailPage({ params }: Props) {
  const { id } = await params;
  const { profile } = await requireAuthUser();

  if (id === "new") {
    redirect("/ideas");
  }

  const [idea, rawBlocks, rawRelationships] = await Promise.all([
    ideaRepository.findById(id, profile.id),
    ideaBlockRepository.findAllByIdea(id),
    ideaRelationshipRepository.findAllByIdea(id),
  ]);

  if (!idea) notFound();

  const blocks: BlockEditorBlock[] = rawBlocks.map((b) => ({
    id: b.id,
    type: b.type as BlockType,
    content: b.content,
    completed: b.completed,
    updatedAt: b.updatedAt,
  }));

  const relationships: IdeaRelationshipItem[] = rawRelationships.map((r) => ({
    id: r.id,
    relatedIdeaId: r.sourceId === id ? r.targetId : r.sourceId,
    relatedIdeaTitle:
      r.sourceId === id ? r.target.title : r.source.title,
    relationshipType: r.type,
    direction: r.sourceId === id ? "source" : "target",
  }));

  async function handleSaveBlock(blockType: BlockType, content: string) {
    "use server";
    const formData = new FormData();
    formData.set("ideaId", id);
    formData.set("type", blockType);
    formData.set("content", content);
    const result = await saveBlockAction(
      { success: false, error: "" },
      formData
    );
    if (!result.success) throw new Error(result.error);
  }

  async function handleSaveMeta(data: { title?: string; tags?: string[] }) {
    "use server";
    const { requireAuthUser: auth } = await import("@/services/auth.service");
    const { profile: p } = await auth();
    const { ideaRepository: repo } = await import("@/repositories/idea.repository");
    await repo.update(id, p.id, {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.tags !== undefined && { tags: data.tags }),
    });
  }

  async function handleConvert(config: ConversionConfig) {
    "use server";
    const result = await convertIdeaAction({
      ideaId: id,
      projectName: config.projectName,
      projectDescription: config.projectDescription || undefined,
      taskTitles: Array.from(config.selectedTasks)
        .map((i) => config.taskSeeds[i])
        .filter((t): t is string => !!t),
    });
    if (!result.success) throw new Error(result.error);
    const { redirect: nav } = await import("next/navigation");
    nav(`/projects/${result.data.projectId}`);
  }

  async function handleArchive() {
    "use server";
    const { requireAuthUser: auth } = await import("@/services/auth.service");
    const { profile: p } = await auth();
    const { ideaRepository: repo } = await import("@/repositories/idea.repository");
    await repo.update(id, p.id, { status: "ARCHIVED" });
    const { redirect: nav } = await import("next/navigation");
    nav("/ideas");
  }

  return (
    <IdeaEditor
      idea={{
        id: idea.id,
        title: idea.title,
        status: idea.status,
        readinessStatus: idea.readinessStatus,
        readinessScore: Math.round(idea.readinessScore),
        tags: idea.tags,
        pinned: idea.pinned,
        updatedAt: idea.updatedAt,
        blocks,
        relationships,
      }}
      onSaveBlock={handleSaveBlock}
      onSaveMeta={handleSaveMeta}
      onConvert={handleConvert}
      onArchive={handleArchive}
      onAddRelationship={() => {}}
      onRemoveRelationship={() => {}}
    />
  );
}
