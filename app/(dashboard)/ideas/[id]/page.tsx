import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuthUser } from "@/services/auth.service";
import { IdeaEditor } from "@/features/ideas/components/idea-editor";

export const metadata: Metadata = { title: "Idea" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function IdeaDetailPage({ params }: Props) {
  const { id } = await params;
  const { profile } = await requireAuthUser();

  // Phase 1: placeholder — replace with ideaRepository.findByIdWithRelations(id, profile.id)
  if (id === "new") {
    return (
      <IdeaEditor
        idea={{
          id: "new",
          title: "",
          status: "RAW",
          tags: [],
          pinned: false,
          updatedAt: new Date(),
          sections: {
            theme: "",
            problemStatement: "",
            targetUser: "",
            painPoints: "",
            marketGap: "",
            features: "",
            executionNotes: "",
          },
        }}
        onSave={async () => {}}
        onConvert={() => {}}
        onArchive={() => {}}
      />
    );
  }

  // Real data fetching — Phase 2
  notFound();
}
