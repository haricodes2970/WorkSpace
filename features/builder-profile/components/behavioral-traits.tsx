"use client";

import type { BuilderTrait } from "@/features/builder-profile/builder-profile.service";
import { cn } from "@/lib/utils";

const TRAIT_META: Record<BuilderTrait, { label: string; desc: string; cls: string }> = {
  "fast-ideator":     { label: "Fast Ideator",     desc: "5+ ideas per month",           cls: "bg-[--color-warning]/10 text-[--color-warning] border-[--color-warning]/20" },
  "deep-thinker":     { label: "Deep Thinker",     desc: "Rich knowledge base",          cls: "bg-[--color-primary]/10 text-[--color-primary] border-[--color-primary]/20" },
  "finisher":         { label: "Finisher",         desc: "Ships what you start",         cls: "bg-[--color-success]/10 text-[--color-success] border-[--color-success]/20" },
  "knowledge-builder":{ label: "Knowledge Builder",desc: "High memory density",          cls: "bg-[--color-accent]/10 text-[--color-accent] border-[--color-accent]/20" },
  "momentum-keeper":  { label: "Momentum Keeper",  desc: "Active with no stale projects",cls: "bg-[--color-success]/10 text-[--color-success] border-[--color-success]/20" },
  "explorer":         { label: "Explorer",         desc: "Wide ideation surface",        cls: "bg-[--color-warning]/10 text-[--color-warning] border-[--color-warning]/20" },
  "focused-builder":  { label: "Focused Builder",  desc: "Few projects, high follow-through", cls: "bg-[--color-primary]/10 text-[--color-primary] border-[--color-primary]/20" },
  "reflective":       { label: "Reflective",       desc: "Regular strategic reviews",    cls: "bg-[--color-text-muted]/10 text-[--color-text-secondary] border-[--color-border]" },
};

interface BehavioralTraitsProps {
  traits:     BuilderTrait[];
  className?: string;
}

export function BehavioralTraits({ traits, className }: BehavioralTraitsProps) {
  if (traits.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {traits.map((t) => {
        const m = TRAIT_META[t];
        return (
          <span
            key={t}
            title={m.desc}
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium",
              m.cls
            )}
          >
            {m.label}
          </span>
        );
      })}
    </div>
  );
}
