"use client";

import { Lightbulb, FolderKanban, Brain, BookOpenText, TrendingUp } from "lucide-react";
import type { BuilderProfile } from "@/features/builder-profile/builder-profile.service";
import { BehavioralTraits } from "./behavioral-traits";
import { cn } from "@/lib/utils";

function StatCell({ icon, value, label }: {
  icon:  React.ReactNode;
  value: number | string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-[--color-border] bg-[--color-card] px-4 py-3">
      <span className="text-[--color-text-muted]">{icon}</span>
      <span className="text-lg font-semibold text-[--color-text-primary] tabular-nums">{value}</span>
      <span className="text-[11px] text-[--color-text-muted]">{label}</span>
    </div>
  );
}

function Bar({ value, className }: { value: number; className?: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-[--color-card] overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all", className ?? "bg-[--color-primary]")}
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  );
}

interface ProfileSummaryProps {
  profile: BuilderProfile;
}

export function ProfileSummary({ profile }: ProfileSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-5 gap-2">
        <StatCell icon={<Lightbulb   className="h-4 w-4" />} value={profile.totalIdeas}      label="ideas"    />
        <StatCell icon={<FolderKanban className="h-4 w-4" />} value={profile.activeProjects}  label="active"   />
        <StatCell icon={<FolderKanban className="h-4 w-4 text-[--color-success]" />} value={profile.shippedProjects} label="shipped" />
        <StatCell icon={<Brain        className="h-4 w-4" />} value={profile.totalMemories}   label="memories" />
        <StatCell icon={<BookOpenText className="h-4 w-4" />} value={profile.totalReviews}    label="reviews"  />
      </div>

      {/* Execution metrics */}
      <div className="rounded-lg border border-[--color-border] bg-[--color-card] p-4 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[--color-text-muted]">
          Execution Metrics
        </p>
        <div className="space-y-2.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] text-[--color-text-secondary]">Ship rate</span>
              <span className="text-[12px] font-mono text-[--color-text-primary]">
                {Math.round(profile.shipRate * 100)}%
              </span>
            </div>
            <Bar value={profile.shipRate} className="bg-[--color-success]" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] text-[--color-text-secondary]">Follow-through</span>
              <span className="text-[12px] font-mono text-[--color-text-primary]">
                {Math.round(profile.followThrough * 100)}%
              </span>
            </div>
            <Bar value={profile.followThrough} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] text-[--color-text-secondary]">Momentum score</span>
              <span className="text-[12px] font-mono text-[--color-text-primary]">
                {profile.momentumScore}/100
              </span>
            </div>
            <Bar value={profile.momentumScore / 100} className="bg-[--color-warning]" />
          </div>
        </div>
      </div>

      {/* Traits */}
      {profile.traits.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[--color-text-muted]">
            Builder Traits
          </p>
          <BehavioralTraits traits={profile.traits} />
        </div>
      )}
    </div>
  );
}
