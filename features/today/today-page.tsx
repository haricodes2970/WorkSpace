"use client";

import { useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sun, Zap, FolderKanban, Brain, RotateCcw,
  CalendarCheck, GitCommit,
} from "lucide-react";
import { motionPresets } from "@/lib/design-tokens";
import { formatRelativeTime } from "@/lib/utils";
import { BuildCard }      from "./components/build-card";
import { TaskQueue }      from "./components/task-queue";
import { BlockerStrip }   from "./components/blocker-strip";
import { InsightBanner }  from "./components/insight-banner";
import type { TodayData } from "./today.service";

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({
  title,
  count,
  icon,
  children,
  empty,
}: {
  title: string;
  count?: number;
  icon: React.ReactNode;
  children: React.ReactNode;
  empty?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[--color-text-muted]">{icon}</span>
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[--color-text-muted]">
          {title}
        </h2>
        {typeof count === "number" && count > 0 && (
          <span className="ml-auto text-[11px] tabular-nums text-[--color-text-muted]">
            {count}
          </span>
        )}
      </div>
      {empty ?? children}
    </div>
  );
}

// ─── Right panel items ───────────────────────────────────────────────────────

function StaleItem({ id, title, daysSince }: { id: string; title: string; daysSince: number }) {
  return (
    <Link
      href={`/projects/${id}` as `/projects/${string}`}
      className="flex items-center justify-between rounded-md px-2.5 py-1.5 hover:bg-[--color-card] transition-colors group"
    >
      <p className="text-[12px] text-[--color-text-secondary] group-hover:text-[--color-text-primary] truncate transition-colors">
        {title}
      </p>
      <span className="text-[11px] text-[--color-text-muted] shrink-0 ml-2">
        {daysSince}d
      </span>
    </Link>
  );
}

function DecisionItem({
  id,
  title,
  projectTitle,
  projectId,
  createdAt,
}: {
  id: string;
  title: string;
  projectTitle: string;
  projectId: string;
  createdAt: Date;
}) {
  return (
    <Link
      href={`/projects/${projectId}` as `/projects/${string}`}
      className="flex items-start gap-2 rounded-md px-2.5 py-1.5 hover:bg-[--color-card] transition-colors group"
    >
      <GitCommit className="h-3 w-3 text-[--color-text-muted] shrink-0 mt-1" />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-[--color-text-secondary] group-hover:text-[--color-text-primary] truncate transition-colors">
          {title}
        </p>
        <p className="text-[11px] text-[--color-text-muted] truncate">
          {projectTitle} · {formatRelativeTime(createdAt)}
        </p>
      </div>
    </Link>
  );
}

// ─── Momentum indicator ──────────────────────────────────────────────────────

function MomentumPulse({ score }: { score: number }) {
  const color =
    score >= 70 ? "text-[--color-success]" :
    score >= 40 ? "text-[--color-warning]" :
    "text-[--color-danger]";

  return (
    <span className={`text-[28px] font-semibold tabular-nums leading-none ${color}`}>
      {score}
    </span>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export interface TodayPageProps {
  data: TodayData;
  userName: string | null;
  onDismissInsight: (id: string) => Promise<void>;
}

export function TodayPage({ data, userName, onDismissInsight }: TodayPageProps) {
  const [, startTransition] = useTransition();
  const greeting = getGreeting();
  const name = userName?.split(" ")[0] ?? "there";

  function handleDismiss(id: string) {
    startTransition(async () => {
      await onDismissInsight(id);
    });
  }

  const hasBlockers   = data.blockers.length > 0;
  const hasTasks      = data.tasks.length > 0;
  const hasInsights   = data.insights.length > 0;
  const hasStale      = data.staleProjects.length > 0;
  const hasDecisions  = data.decisions.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <motion.div
        className="flex items-end justify-between px-6 pt-6 pb-4 border-b border-[--color-border-subtle]"
        {...motionPresets.fadeUp}
      >
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Sun className="h-4 w-4 text-[--color-warning] opacity-80" />
            <span className="text-[12px] text-[--color-text-muted]">
              {greeting}, {name}
            </span>
          </div>
          <h1 className="text-[18px] font-semibold text-[--color-text-primary] tracking-tight">
            Today
          </h1>
        </div>

        {/* Momentum snapshot */}
        <div className="flex items-end gap-4 text-right">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[--color-text-muted] mb-1">
              avg momentum
            </p>
            <MomentumPulse score={data.avgMomentum} />
          </div>
          {data.totalActive > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[--color-text-muted] mb-1">
                active
              </p>
              <span className="text-[28px] font-semibold tabular-nums leading-none text-[--color-text-secondary]">
                {data.totalActive}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Body: 2-column */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-0 h-full">

          {/* Left: execution surface */}
          <div className="flex flex-col gap-6 p-6 border-r border-[--color-border-subtle] overflow-y-auto">

            {/* Active builds */}
            <motion.div {...motionPresets.fadeUp} transition={{ delay: 0.05, duration: 0.2 }}>
              <Section
                title="Active Builds"
                count={data.activeBuilds.length}
                icon={<FolderKanban className="h-3.5 w-3.5" />}
              >
                {data.activeBuilds.length === 0 ? (
                  <p className="text-[12px] text-[--color-text-muted] py-2">
                    No active projects.{" "}
                    <Link href="/projects/new" className="text-[--color-primary] hover:underline">
                      Start one
                    </Link>
                    .
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {data.activeBuilds.map((build) => (
                      <BuildCard key={build.id} build={build} />
                    ))}
                  </div>
                )}
              </Section>
            </motion.div>

            {/* Focus queue */}
            {hasTasks && (
              <motion.div {...motionPresets.fadeUp} transition={{ delay: 0.08, duration: 0.2 }}>
                <Section
                  title="Focus Queue"
                  count={data.tasks.length}
                  icon={<Zap className="h-3.5 w-3.5" />}
                >
                  <TaskQueue tasks={data.tasks} />
                </Section>
              </motion.div>
            )}

            {/* Blockers */}
            {hasBlockers && (
              <motion.div {...motionPresets.fadeUp} transition={{ delay: 0.1, duration: 0.2 }}>
                <Section
                  title="Blockers"
                  count={data.blockers.length}
                  icon={<span className="h-3.5 w-3.5 text-[--color-danger]">⛔</span>}
                >
                  <BlockerStrip blockers={data.blockers} />
                </Section>
              </motion.div>
            )}

            {/* All clear */}
            {!hasBlockers && !hasTasks && data.activeBuilds.length === 0 && (
              <motion.div {...motionPresets.fadeUp} transition={{ delay: 0.1, duration: 0.2 }}>
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-4xl mb-3">🎯</span>
                  <p className="text-[14px] text-[--color-text-secondary]">Clear execution surface.</p>
                  <p className="text-[12px] text-[--color-text-muted] mt-1">Start a project or capture an idea.</p>
                  <div className="flex gap-3 mt-4">
                    <Link
                      href="/projects/new"
                      className="text-[12px] text-[--color-primary] hover:underline"
                    >
                      New project
                    </Link>
                    <Link
                      href="/ideas/new"
                      className="text-[12px] text-[--color-text-muted] hover:text-[--color-text-secondary]"
                    >
                      Capture idea
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right: intelligence surface */}
          <div className="flex flex-col gap-6 p-5 overflow-y-auto">

            {/* Signals */}
            {hasInsights && (
              <motion.div {...motionPresets.fadeUp} transition={{ delay: 0.1, duration: 0.2 }}>
                <Section
                  title="Signals"
                  count={data.insights.length}
                  icon={<Brain className="h-3.5 w-3.5" />}
                >
                  <InsightBanner insights={data.insights} onDismiss={handleDismiss} />
                </Section>
              </motion.div>
            )}

            {/* Needs review */}
            {hasStale && (
              <motion.div {...motionPresets.fadeUp} transition={{ delay: 0.12, duration: 0.2 }}>
                <Section
                  title="Needs Review"
                  count={data.staleProjects.length}
                  icon={<RotateCcw className="h-3.5 w-3.5" />}
                >
                  <div className="flex flex-col gap-0.5">
                    {data.staleProjects.map((p) => (
                      <StaleItem key={p.id} {...p} />
                    ))}
                  </div>
                </Section>
              </motion.div>
            )}

            {/* Recent decisions */}
            {hasDecisions && (
              <motion.div {...motionPresets.fadeUp} transition={{ delay: 0.14, duration: 0.2 }}>
                <Section
                  title="Recent Decisions"
                  count={data.decisions.length}
                  icon={<CalendarCheck className="h-3.5 w-3.5" />}
                >
                  <div className="flex flex-col gap-0.5">
                    {data.decisions.map((d) => (
                      <DecisionItem key={d.id} {...d} />
                    ))}
                  </div>
                </Section>
              </motion.div>
            )}

            {/* All clear right panel */}
            {!hasInsights && !hasStale && !hasDecisions && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-[12px] text-[--color-text-muted]">
                  No signals or pending reviews.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
