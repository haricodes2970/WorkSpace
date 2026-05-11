import type { Metadata } from "next";
import { requireAuthUser } from "@/services/auth.service";
import { ideaRepository } from "@/repositories/idea.repository";
import { IdeasWorkspace } from "@/features/ideas/components/ideas-workspace";
import type { IdeaListItem } from "@/features/ideas/components/ideas-workspace";
import type { InboxItem } from "@/features/ideas/components/inbox-view";

export const metadata: Metadata = { title: "Ideas" };

export default async function IdeasPage() {
  const { profile } = await requireAuthUser();

  const allIdeas = await ideaRepository.findAllByUser(profile.id);

  const ideas: IdeaListItem[] = allIdeas
    .filter((i) => i.status !== "ARCHIVED")
    .map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description,
      status: i.status,
      readinessScore: Math.round(i.readinessScore),
      readinessStatus: i.readinessStatus,
      tags: i.tags,
      pinned: i.pinned,
      updatedAt: i.updatedAt,
    }));

  // Inbox = CAPTURED ideas with no blocks yet (raw captures)
  const inboxItems: InboxItem[] = allIdeas
    .filter((i) => i.readinessStatus === "CAPTURED" && i.status !== "ARCHIVED")
    .map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description,
      readinessScore: Math.round(i.readinessScore),
      readinessStatus: i.readinessStatus,
      capturedAt: i.createdAt,
      tags: i.tags,
    }));

  return (
    <IdeasWorkspace
      ideas={ideas}
      inboxItems={inboxItems}
    />
  );
}
