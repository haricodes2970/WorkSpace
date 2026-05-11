"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, Check, Circle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { BlockDefinition } from "./block-types";
import type { SaveStatus } from "../hooks/use-autosave";

interface ThinkingBlockProps {
  def: BlockDefinition;
  content: string;
  completed: boolean;
  collapsed: boolean;
  active: boolean;
  saveStatus?: SaveStatus;
  onChange: (content: string) => void;
  onToggleCollapse: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

export function ThinkingBlock({
  def,
  content,
  completed,
  collapsed,
  active,
  saveStatus,
  onChange,
  onToggleCollapse,
  onFocus,
  onBlur,
}: ThinkingBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const Icon = def.icon;
  const filled = content.trim().length >= (def.scoredFactor ? 20 : 10);

  return (
    <motion.section
      layout="position"
      className={cn(
        "rounded-lg border overflow-hidden transition-colors",
        active
          ? "border-[--color-primary]/30 shadow-sm shadow-[--color-primary]/5"
          : filled
          ? "border-[--color-border]"
          : "border-[--color-border-subtle]"
      )}
    >
      {/* ── Header ── */}
      <button
        type="button"
        onClick={() => {
          onToggleCollapse();
          if (collapsed) {
            setTimeout(() => textareaRef.current?.focus(), 180);
          }
        }}
        className={cn(
          "flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors",
          active ? "bg-[--color-card]" : "bg-[--color-card] hover:bg-[--color-card-hover]"
        )}
        aria-expanded={!collapsed}
      >
        {/* Collapse chevron */}
        <span className="text-[--color-text-muted] shrink-0">
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </span>

        {/* Block icon */}
        <Icon
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            active ? "text-[--color-primary]" : "text-[--color-text-muted]"
          )}
          aria-hidden
        />

        {/* Label */}
        <span
          className={cn(
            "flex-1 text-[13px] font-medium",
            active ? "text-[--color-text-primary]" : "text-[--color-text-secondary]"
          )}
        >
          {def.label}
        </span>

        {/* Status indicators */}
        <div className="flex items-center gap-2 shrink-0">
          {def.requiredForConversion && (
            <span className="text-[10px] text-[--color-text-muted] hidden sm:block">
              required
            </span>
          )}
          {filled ? (
            <Check className="h-3.5 w-3.5 text-[--color-success]" />
          ) : (
            <Circle className="h-3.5 w-3.5 text-[--color-text-muted] opacity-30" />
          )}
          {saveStatus === "saving" && active && (
            <span className="h-1.5 w-1.5 rounded-full bg-[--color-text-muted] animate-pulse-subtle" />
          )}
        </div>
      </button>

      {/* ── Body ── */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 bg-[--color-bg]">
              {def.hint && (
                <p className="text-[11px] text-[--color-text-muted] mb-2 italic">
                  {def.hint}
                </p>
              )}
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => onChange(e.target.value)}
                placeholder={def.placeholder}
                rows={4}
                autoResize
                onFocus={onFocus}
                onBlur={onBlur}
                className={cn(
                  "bg-transparent border-0 p-0 focus:ring-0 focus:border-0",
                  "text-[13px] leading-relaxed font-[var(--font-mono)]",
                  "text-[--color-text-secondary] placeholder:text-[--color-text-muted]",
                  "min-h-[80px]"
                )}
                aria-label={def.label}
              />
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[--color-border-subtle]">
                <span className="text-[11px] text-[--color-text-muted] tabular-nums">
                  {content.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                {def.scoredFactor && (
                  <span className="text-[10px] text-[--color-text-muted]">
                    {def.requiredForConversion ? "★ required for conversion" : "contributes to score"}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
