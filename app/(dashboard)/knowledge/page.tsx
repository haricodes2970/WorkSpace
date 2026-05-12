import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { requireAuthUser } from "@/services/auth.service";
import { memoryRepository } from "@/features/intelligence/memories/memory.repository";
import { insightRepository } from "@/features/intelligence/insights/insight.repository";
import { retrospectiveRepository } from "@/features/intelligence/retrospectives/retrospective.repository";
import {
  addMemoryAction, deleteMemoryAction, pinMemoryAction,
  dismissInsightAction, refreshInsightsAction,
  saveRetrospectiveAction, deleteRetrospectiveAction,
} from "@/features/intelligence/actions/intelligence-actions";
import { KnowledgePage } from "@/features/intelligence/knowledge-page";

export const metadata: Metadata = { title: "Knowledge" };

export default async function KnowledgePageRoute() {
  const { profile } = await requireAuthUser();

  // Fetch all knowledge data in parallel
  const [memories, insights, retrospectives] = await Promise.all([
    memoryRepository.findAllByUser(profile.id),
    insightRepository.findActive(profile.id),
    retrospectiveRepository.findAllByUser(profile.id),
  ]);

  // ── Handlers ──────────────────────────────────────────────────────────

  async function handleAddMemory(input: unknown) {
    "use server";
    const result = await addMemoryAction(input);
    revalidatePath("/knowledge");
    return result;
  }

  async function handleDeleteMemory(id: string) {
    "use server";
    await deleteMemoryAction(id);
    revalidatePath("/knowledge");
  }

  async function handlePinMemory(id: string, pinned: boolean) {
    "use server";
    await pinMemoryAction(id, pinned);
    revalidatePath("/knowledge");
  }

  async function handleDismissInsight(id: string) {
    "use server";
    await dismissInsightAction(id);
    revalidatePath("/knowledge");
  }

  async function handleRefreshInsights() {
    "use server";
    await refreshInsightsAction();
    revalidatePath("/knowledge");
  }

  async function handleSaveRetro(input: unknown) {
    "use server";
    const result = await saveRetrospectiveAction(input);
    revalidatePath("/knowledge");
    return result;
  }

  async function handleDeleteRetro(id: string) {
    "use server";
    await deleteRetrospectiveAction(id);
    revalidatePath("/knowledge");
  }

  return (
    <KnowledgePage
      memories={memories.map((m) => ({
        id:           m.id,
        type:         m.type,
        title:        m.title,
        body:         m.body,
        tags:         m.tags,
        significance: m.significance,
        pinned:       m.pinned,
        createdAt:    m.createdAt,
      }))}
      insights={insights.map((i) => ({
        id:          i.id,
        type:        i.type,
        title:       i.title,
        body:        i.body,
        severity:    i.severity,
        generatedAt: i.generatedAt,
      }))}
      retrospectives={retrospectives.map((r) => ({
        id:          r.id,
        type:        r.type,
        title:       r.title,
        period:      r.period,
        wentWell:    r.wentWell,
        wentPoorly:  r.wentPoorly,
        learned:     r.learned,
        nextActions: r.nextActions,
        createdAt:   r.createdAt,
      }))}
      onAddMemory={handleAddMemory}
      onDeleteMemory={handleDeleteMemory}
      onPinMemory={handlePinMemory}
      onDismissInsight={handleDismissInsight}
      onRefreshInsights={handleRefreshInsights}
      onSaveRetro={handleSaveRetro}
      onDeleteRetro={handleDeleteRetro}
    />
  );
}
