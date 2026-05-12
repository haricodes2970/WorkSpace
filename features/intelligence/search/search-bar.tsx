"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Lightbulb, FolderKanban, FileText, Brain,
  GitCommit, Loader2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { searchAction } from "../actions/intelligence-actions";
import type { SearchResult, SearchResultType } from "./search.service";
import Link from "next/link";

// ─── Config ───────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<SearchResultType, { icon: React.ReactNode; label: string }> = {
  idea:     { icon: <Lightbulb className="h-3.5 w-3.5 text-[--color-warning]" />,   label: "Idea" },
  project:  { icon: <FolderKanban className="h-3.5 w-3.5 text-[--color-accent]" />, label: "Project" },
  decision: { icon: <GitCommit className="h-3.5 w-3.5 text-[--color-text-muted]" />, label: "Decision" },
  note:     { icon: <FileText className="h-3.5 w-3.5 text-[--color-text-muted]" />,  label: "Note" },
  memory:   { icon: <Brain className="h-3.5 w-3.5 text-[--color-primary]" />,        label: "Memory" },
  milestone:{ icon: <FolderKanban className="h-3.5 w-3.5 text-[--color-success]" />, label: "Milestone" },
};

// ─── Search Result Row ────────────────────────────────────────────────────

function ResultRow({ result, onSelect }: { result: SearchResult; onSelect: () => void }) {
  const { icon } = TYPE_CONFIG[result.type];
  return (
    <Command.Item
      value={result.id}
      onSelect={onSelect}
      className="flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer data-[selected]:bg-[--color-primary-subtle] transition-colors group"
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Link href={result.url as any} className="flex items-center gap-2.5 w-full min-w-0">
        <span className="shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-[--color-text-primary] truncate">{result.title}</p>
          {result.excerpt && (
            <p className="text-[11px] text-[--color-text-muted] truncate">{result.excerpt}</p>
          )}
        </div>
        {result.sublabel && (
          <span className="text-[9px] text-[--color-text-muted] bg-[--color-card] border border-[--color-border-subtle] px-1.5 py-0.5 rounded-full shrink-0">
            {result.sublabel}
          </span>
        )}
      </Link>
    </Command.Item>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

interface SearchBarProps {
  onClose: () => void;
}

export function SearchBar({ onClose }: SearchBarProps) {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }

    startTransition(async () => {
      const res = await searchAction(q);
      if (res.success) setResults(res.data);
    });
  }, []);

  // Close on escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type]!.push(r);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      <Command shouldFilter={false} className="flex flex-col h-full">
        {/* Input */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[--color-border-subtle]">
          {isPending
            ? <Loader2 className="h-4 w-4 text-[--color-text-muted] shrink-0 animate-spin" />
            : <Search className="h-4 w-4 text-[--color-text-muted] shrink-0" />
          }
          <Command.Input
            value={query}
            onValueChange={handleSearch}
            placeholder="Search ideas, projects, decisions, memories…"
            className="flex-1 bg-transparent text-[13px] text-[--color-text-primary] placeholder-[--color-text-muted] focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); setResults([]); }}
              className="shrink-0 text-[--color-text-muted] hover:text-[--color-text-secondary]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Results */}
        <Command.List className="flex-1 overflow-y-auto p-2">
          {!query && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-8 w-8 text-[--color-text-muted] opacity-20 mb-3" />
              <p className="text-[13px] text-[--color-text-muted]">Search your workspace</p>
              <p className="text-[11px] text-[--color-text-muted] opacity-70 mt-1">
                Ideas, projects, decisions, notes, memories
              </p>
            </div>
          )}

          {query && results.length === 0 && !isPending && (
            <Command.Empty className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-[13px] text-[--color-text-muted]">No results for "{query}"</p>
            </Command.Empty>
          )}

          {Object.entries(grouped).map(([type, items]) => {
            const cfg = TYPE_CONFIG[type as SearchResultType];
            return (
              <Command.Group
                key={type}
                heading={
                  <span className="flex items-center gap-1.5 px-1 py-1.5 text-[10px] font-semibold text-[--color-text-muted] uppercase tracking-wider">
                    {cfg.icon} {cfg.label}s
                  </span>
                }
              >
                {items.map((r) => (
                  <ResultRow key={r.id} result={r} onSelect={onClose} />
                ))}
              </Command.Group>
            );
          })}
        </Command.List>

        {/* Footer */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-[--color-border-subtle]">
          <span className="text-[10px] text-[--color-text-muted] flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border border-[--color-border] text-[9px]">↑↓</kbd> navigate
          </span>
          <span className="text-[10px] text-[--color-text-muted] flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border border-[--color-border] text-[9px]">↵</kbd> open
          </span>
          <span className="text-[10px] text-[--color-text-muted] flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border border-[--color-border] text-[9px]">Esc</kbd> close
          </span>
        </div>
      </Command>
    </div>
  );
}
