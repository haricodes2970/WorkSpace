"use client";

import { useEffect, useState, useCallback, useTransition, useRef } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Lightbulb, FolderKanban, Zap, Brain,
  Plus, Search, ArrowRight, Sun, Clock, Loader2,
  BookOpenText, Sparkles, Download,
} from "lucide-react";
import { motionPresets } from "@/lib/design-tokens";
import { searchAction } from "@/features/intelligence/actions/intelligence-actions";
import {
  getRecentItems,
  pushRecentItem,
  type RecentItem,
} from "@/features/command/command-store";
import type { SearchResult, SearchResultType } from "@/features/intelligence/search/search.service";

// ─── Type icon map ────────────────────────────────────────────────────────────

const TYPE_ICON: Record<SearchResultType, React.ReactNode> = {
  idea:      <Lightbulb  className="h-3.5 w-3.5 text-[--color-warning]" />,
  project:   <FolderKanban className="h-3.5 w-3.5 text-[--color-accent]" />,
  decision:  <ArrowRight className="h-3.5 w-3.5 text-[--color-text-muted]" />,
  note:      <Brain      className="h-3.5 w-3.5 text-[--color-text-muted]" />,
  memory:    <Brain      className="h-3.5 w-3.5 text-[--color-primary]" />,
  milestone: <FolderKanban className="h-3.5 w-3.5 text-[--color-success]" />,
};

const RECENT_TYPE_ICON: Record<RecentItem["type"], React.ReactNode> = {
  idea:      <Lightbulb  className="h-3.5 w-3.5 text-[--color-warning]" />,
  project:   <FolderKanban className="h-3.5 w-3.5 text-[--color-accent]" />,
  knowledge: <Brain      className="h-3.5 w-3.5 text-[--color-primary]" />,
  page:      <LayoutDashboard className="h-3.5 w-3.5 text-[--color-text-muted]" />,
};

// ─── Static nav + create items ────────────────────────────────────────────────

interface StaticItem {
  id:       string;
  label:    string;
  sublabel?: string;
  group:    string;
  icon:     React.ReactNode;
  shortcut?: string;
  href:     string;
}

const STATIC_ITEMS: StaticItem[] = [
  { id: "today",     label: "Today",            group: "Navigate", icon: <Sun className="h-3.5 w-3.5" />,              shortcut: "G O", href: "/today"     },
  { id: "dashboard", label: "Dashboard",        group: "Navigate", icon: <LayoutDashboard className="h-3.5 w-3.5" />,   shortcut: "G D", href: "/dashboard" },
  { id: "ideas",     label: "Ideas",            group: "Navigate", icon: <Lightbulb className="h-3.5 w-3.5" />,         shortcut: "G I", href: "/ideas"     },
  { id: "projects",  label: "Projects",         group: "Navigate", icon: <FolderKanban className="h-3.5 w-3.5" />,      shortcut: "G P", href: "/projects"  },
  { id: "tasks",     label: "Tasks",            group: "Navigate", icon: <Zap className="h-3.5 w-3.5" />,               shortcut: "G T", href: "/tasks"     },
  { id: "knowledge", label: "Knowledge",        group: "Navigate", icon: <Brain className="h-3.5 w-3.5" />,             shortcut: "G K", href: "/knowledge" },
  { id: "advisor",   label: "Advisor",          group: "Navigate", icon: <Sparkles className="h-3.5 w-3.5" />,          shortcut: "G A", href: "/advisor"   },
  { id: "reviews",   label: "Strategic Reviews",group: "Navigate", icon: <BookOpenText className="h-3.5 w-3.5" />,      shortcut: "G R", href: "/reviews"   },
  { id: "new-idea",  label: "New Idea",         group: "Create",   icon: <Plus className="h-3.5 w-3.5" />,              shortcut: "N I", href: "/ideas/new"    },
  { id: "new-proj",  label: "New Project",      group: "Create",   icon: <Plus className="h-3.5 w-3.5" />,              shortcut: "N P", href: "/projects/new" },
  { id: "new-review",label: "New Review",       group: "Create",   icon: <Plus className="h-3.5 w-3.5" />,              shortcut: "N R", href: "/reviews/new"  },
  { id: "export",    label: "Export Workspace", group: "System",   icon: <Download className="h-3.5 w-3.5" />,                           href: "/settings/export" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router  = useRouter();
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recents, setRecents] = useState<RecentItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const openedAt = useRef(0);

  const close = useCallback(() => {
    onOpenChange(false);
    setQuery("");
    setResults([]);
  }, [onOpenChange]);

  // Load recents when opening
  useEffect(() => {
    if (open) {
      openedAt.current = Date.now();
      setRecents(getRecentItems());
    }
  }, [open]);

  // Keyboard shortcuts
  useEffect(() => {
    function down(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  // Search on query change
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    startTransition(async () => {
      const res = await searchAction(query);
      if (res.success) setResults(res.data);
    });
  }, [query]);

  function navigate(href: string, item?: Omit<RecentItem, "visitedAt">) {
    if (item) pushRecentItem(item);
    router.push(href as Route);
    close();
  }

  const showSearch  = query.trim().length > 0;
  const showRecents = !showSearch && recents.length > 0;
  const showStatic  = !showSearch;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-[--color-overlay] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={close}
          />

          <motion.div
            className="fixed left-1/2 top-[18%] z-50 w-full max-w-[580px] -translate-x-1/2"
            {...motionPresets.fadeUp}
          >
            <Command
              className="rounded-xl border border-[--color-border] bg-[--color-panel] shadow-2xl overflow-hidden"
              loop
              shouldFilter={!showSearch}
            >
              {/* Input */}
              <div className="flex items-center gap-3 border-b border-[--color-border-subtle] px-4 py-3">
                {isPending
                  ? <Loader2 className="h-4 w-4 shrink-0 text-[--color-text-muted] animate-spin" />
                  : <Search  className="h-4 w-4 shrink-0 text-[--color-text-muted]" />
                }
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search or jump to…"
                  className="flex-1 bg-transparent text-[13px] text-[--color-text-primary] placeholder:text-[--color-text-muted] outline-none"
                />
                <kbd className="hidden sm:inline-flex items-center rounded border border-[--color-border] bg-[--color-card] px-1.5 py-0.5 text-[11px] font-mono text-[--color-text-muted]">
                  ESC
                </kbd>
              </div>

              {/* List */}
              <Command.List className="max-h-[400px] overflow-y-auto p-1.5">
                <Command.Empty className="py-10 text-center text-[13px] text-[--color-text-muted]">
                  No results for &ldquo;{query}&rdquo;
                </Command.Empty>

                {/* Search results */}
                {showSearch && results.length > 0 && (
                  <Command.Group
                    heading="Results"
                    className={groupHeadingCls}
                  >
                    {results.slice(0, 8).map((r) => (
                      <CommandRow
                        key={r.id}
                        icon={TYPE_ICON[r.type]}
                        label={r.title}
                        sublabel={r.sublabel ?? r.type}
                        onSelect={() =>
                          navigate(r.url, {
                            id:      r.id,
                            label:   r.title,
                            sublabel: r.sublabel ?? undefined,
                            href:    r.url,
                            type:    r.type === "memory" ? "knowledge" :
                                     r.type === "decision" || r.type === "note" ? "project" :
                                     r.type as RecentItem["type"],
                          })
                        }
                      />
                    ))}
                  </Command.Group>
                )}

                {/* Recent items */}
                {showRecents && (
                  <Command.Group heading="Recent" className={groupHeadingCls}>
                    {recents.map((r) => (
                      <CommandRow
                        key={r.id}
                        icon={<Clock className="h-3.5 w-3.5 text-[--color-text-muted]" />}
                        label={r.label}
                        sublabel={r.sublabel}
                        rightIcon={RECENT_TYPE_ICON[r.type]}
                        onSelect={() => navigate(r.href)}
                      />
                    ))}
                  </Command.Group>
                )}

                {/* Static nav */}
                {showStatic && (
                  <>
                    {["Navigate", "Create", "System"].map((group) => (
                      <Command.Group key={group} heading={group} className={groupHeadingCls}>
                        {STATIC_ITEMS
                          .filter((i) => i.group === group)
                          .map((item) => (
                            <CommandRow
                              key={item.id}
                              icon={item.icon}
                              label={item.label}
                              shortcut={item.shortcut}
                              onSelect={() =>
                                navigate(item.href, {
                                  id:    item.id,
                                  label: item.label,
                                  href:  item.href,
                                  type:  "page",
                                })
                              }
                            />
                          ))}
                      </Command.Group>
                    ))}
                  </>
                )}
              </Command.List>

              {/* Footer */}
              <div className="flex items-center gap-4 border-t border-[--color-border-subtle] px-4 py-2">
                <FooterKey keys={["↑", "↓"]} label="navigate" />
                <FooterKey keys={["↵"]}       label="open" />
                <FooterKey keys={["Esc"]}      label="close" />
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const groupHeadingCls =
  "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[--color-text-muted] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider";

function CommandRow({
  icon,
  label,
  sublabel,
  shortcut,
  rightIcon,
  onSelect,
}: {
  icon:      React.ReactNode;
  label:     string;
  sublabel?: string | null;
  shortcut?: string;
  rightIcon?: React.ReactNode;
  onSelect:  () => void;
}) {
  return (
    <Command.Item
      value={label}
      onSelect={onSelect}
      className="flex items-center gap-3 rounded-md px-2.5 py-2 text-[13px] text-[--color-text-secondary] cursor-pointer transition-colors aria-selected:bg-[--color-primary-subtle] aria-selected:text-[--color-text-primary] hover:bg-[--color-card]"
    >
      <span className="text-[--color-text-muted] shrink-0">{icon}</span>
      <span className="flex-1 min-w-0 truncate">{label}</span>
      {sublabel && (
        <span className="text-[11px] text-[--color-text-muted] shrink-0">{sublabel}</span>
      )}
      {rightIcon && <span className="shrink-0">{rightIcon}</span>}
      {shortcut && (
        <kbd className="shrink-0 font-mono text-[11px] text-[--color-text-muted]">
          {shortcut}
        </kbd>
      )}
    </Command.Item>
  );
}

function FooterKey({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[10px] text-[--color-text-muted]">
      {keys.map((k) => (
        <kbd
          key={k}
          className="inline-flex items-center rounded border border-[--color-border] bg-[--color-card] px-1 py-0.5 font-mono text-[10px]"
        >
          {k}
        </kbd>
      ))}
      <span>{label}</span>
    </span>
  );
}
