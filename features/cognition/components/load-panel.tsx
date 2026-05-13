"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Brain, AlertCircle, Archive, Focus, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCognitionLoadAction } from "@/features/cognition/actions/cognition-actions";
import type { CognitionResult, Suggestion } from "@/features/cognition/cognition.service";

const SUGGESTION_ICON: Record<Suggestion["kind"], React.ReactNode> = {
  archive: <Archive  className="h-3.5 w-3.5" />,
  focus:   <Focus    className="h-3.5 w-3.5" />,
  review:  <Brain    className="h-3.5 w-3.5" />,
  block:   <AlertCircle className="h-3.5 w-3.5" />,
  rest:    <Coffee   className="h-3.5 w-3.5" />,
};

const SUGGESTION_HREF: Record<Suggestion["kind"], string> = {
  archive: "/projects",
  focus:   "/today",
  review:  "/reviews",
  block:   "/projects",
  rest:    "/today",
};

export function CognitionLoadPanel() {
  const [result, setResult]   = useState<CognitionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCognitionLoadAction()
      .then(setResult)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !result || result.level === "calm") return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Brain className="h-3 w-3 text-[--color-text-muted]" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[--color-text-muted]">
          Cognitive Load
        </span>
        <span className={cn(
          "ml-auto text-[10px] font-mono rounded px-1.5 py-0.5",
          result.level === "high"       && "bg-[--color-warning]/10 text-[--color-warning]",
          result.level === "overloaded" && "bg-[--color-error]/10 text-[--color-error]",
          result.level === "moderate"   && "bg-[--color-card] text-[--color-text-muted]",
        )}>
          {result.score}/100
        </span>
      </div>

      <div className="space-y-1">
        {result.suggestions.slice(0, 2).map((s, i) => (
          <Link
            key={i}
            href={SUGGESTION_HREF[s.kind] as never}
            className="group flex items-start gap-2.5 rounded-lg border border-[--color-border] bg-[--color-card] px-3 py-2 transition-colors hover:border-[--color-primary]/30 hover:bg-[--color-primary-subtle]"
          >
            <span className="mt-0.5 shrink-0 text-[--color-text-muted] group-hover:text-[--color-primary]">
              {SUGGESTION_ICON[s.kind]}
            </span>
            <p className="text-[11px] text-[--color-text-secondary] leading-relaxed">
              {s.message}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
