"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Lightbulb, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MemoryPanel, type MemoryData, type MemoryFormInput } from "./memories/memory-panel";
import { InsightCards, type InsightData } from "./insights/insight-cards";
import { RetrospectiveList, type RetrospectiveData, type RetrospectiveFormInput } from "./retrospectives/retrospective-form";
import { motionPresets } from "@/lib/design-tokens";

// ─── Types ────────────────────────────────────────────────────────────────

interface KnowledgePageProps {
  memories:        MemoryData[];
  insights:        InsightData[];
  retrospectives:  RetrospectiveData[];
  onAddMemory:     (input: unknown) => Promise<unknown>;
  onDeleteMemory:  (id: string) => Promise<void>;
  onPinMemory:     (id: string, pinned: boolean) => Promise<void>;
  onDismissInsight:(id: string) => Promise<void>;
  onRefreshInsights:() => Promise<void>;
  onSaveRetro:     (input: unknown) => Promise<unknown>;
  onDeleteRetro:   (id: string) => Promise<void>;
}

type KnowledgeTab = "overview" | "memories" | "insights" | "retrospectives";

// ─── Overview Tab ─────────────────────────────────────────────────────────

function OverviewTab({ memories, insights, onDismissInsight, onRefreshInsights }: {
  memories: MemoryData[];
  insights: InsightData[];
  onDismissInsight:  (id: string) => Promise<void>;
  onRefreshInsights: () => Promise<void>;
}) {
  const byType = memories.reduce<Record<string, number>>((acc, m) => {
    acc[m.type] = (acc[m.type] ?? 0) + 1;
    return acc;
  }, {});

  const recent = memories.slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
      {/* Stats */}
      <div className="xl:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Memories",       value: memories.length,                                  color: "text-[--color-primary]" },
          { label: "Active signals", value: insights.length,                                   color: "text-[--color-warning]" },
          { label: "Insights",       value: byType["INSIGHT"] ?? 0,                           color: "text-[--color-accent]" },
          { label: "Mistakes logged",value: byType["MISTAKE"] ?? 0,                           color: "text-[--color-danger]" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            {...motionPresets.fadeUp}
            className="rounded-lg border border-[--color-border] bg-[--color-card] p-4"
          >
            <p className={cn("text-[24px] font-bold tabular-nums", stat.color)}>{stat.value}</p>
            <p className="text-[11px] text-[--color-text-muted] mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Active signals */}
      <div className="xl:col-span-2">
        <InsightCards
          insights={insights}
          onDismiss={onDismissInsight}
          onRefresh={onRefreshInsights}
        />
      </div>

      {/* Recent memories */}
      <div className="flex flex-col gap-3">
        <p className="text-[11px] text-[--color-text-muted] uppercase tracking-wider font-medium">Recent memories</p>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center py-8 rounded-lg border border-dashed border-[--color-border]">
            <Brain className="h-6 w-6 text-[--color-text-muted] opacity-25 mb-2" />
            <p className="text-[12px] text-[--color-text-muted]">No memories captured yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {recent.map((m) => (
              <div key={m.id} className="rounded-lg border border-[--color-border] bg-[--color-card] px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[9px] font-semibold text-[--color-text-muted] uppercase tracking-wider">{m.type}</span>
                </div>
                <p className="text-[12px] font-medium text-[--color-text-primary] line-clamp-2">{m.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export function KnowledgePage({
  memories, insights, retrospectives,
  onAddMemory, onDeleteMemory, onPinMemory,
  onDismissInsight, onRefreshInsights,
  onSaveRetro, onDeleteRetro,
}: KnowledgePageProps) {
  const [tab, setTab] = useState<KnowledgeTab>("overview");

  const TABS: { id: KnowledgeTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "overview",       label: "Overview",        icon: <Brain className="h-3.5 w-3.5" /> },
    { id: "memories",       label: "Memory",          icon: <Brain className="h-3.5 w-3.5" />,      count: memories.length },
    { id: "insights",       label: "Signals",         icon: <Lightbulb className="h-3.5 w-3.5" />,  count: insights.length },
    { id: "retrospectives", label: "Retrospectives",  icon: <BookOpen className="h-3.5 w-3.5" />,   count: retrospectives.length },
  ];

  async function handleAddMemory(data: MemoryFormInput) {
    await onAddMemory(data);
  }

  async function handleSaveRetro(data: RetrospectiveFormInput) {
    await onSaveRetro(data);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[--color-border-subtle] bg-[--color-panel] shrink-0">
        <Brain className="h-4 w-4 text-[--color-text-muted]" />
        <h1 className="text-[15px] font-semibold text-[--color-text-primary] mr-2">Knowledge</h1>
        <div className="flex items-center gap-1 flex-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors",
                tab === t.id
                  ? "bg-[--color-primary-subtle] text-[--color-text-primary]"
                  : "text-[--color-text-muted] hover:text-[--color-text-secondary] hover:bg-[--color-card]"
              )}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="text-[10px] opacity-60">{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {tab === "overview" && (
          <OverviewTab
            memories={memories}
            insights={insights}
            onDismissInsight={onDismissInsight}
            onRefreshInsights={onRefreshInsights}
          />
        )}

        {tab === "memories" && (
          <div className="px-6 py-5 max-w-2xl">
            <MemoryPanel
              memories={memories}
              onAdd={handleAddMemory}
              onDelete={onDeleteMemory}
              onPin={onPinMemory}
            />
          </div>
        )}

        {tab === "insights" && (
          <div className="px-6 py-5 max-w-2xl">
            <InsightCards
              insights={insights}
              onDismiss={onDismissInsight}
              onRefresh={onRefreshInsights}
            />
          </div>
        )}

        {tab === "retrospectives" && (
          <div className="px-6 py-5 max-w-2xl">
            <RetrospectiveList
              retrospectives={retrospectives}
              onDelete={onDeleteRetro}
              onAdd={handleSaveRetro}
            />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
