"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Lightbulb,
  FolderKanban,
  Zap,
  Plus,
  Search,
  ArrowRight,
} from "lucide-react";
import { motionPresets } from "@/lib/design-tokens";

interface CommandItem {
  id: string;
  label: string;
  group: string;
  icon: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const close = useCallback(() => {
    onOpenChange(false);
    setSearch("");
  }, [onOpenChange]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange, close]);

  const navigate = (href: string) => {
    router.push(href);
    close();
  };

  const items: CommandItem[] = [
    {
      id: "dashboard",
      label: "Go to Dashboard",
      group: "Navigation",
      icon: <LayoutDashboard className="h-4 w-4" />,
      shortcut: "G D",
      onSelect: () => navigate("/dashboard"),
    },
    {
      id: "ideas",
      label: "Go to Ideas",
      group: "Navigation",
      icon: <Lightbulb className="h-4 w-4" />,
      shortcut: "G I",
      onSelect: () => navigate("/ideas"),
    },
    {
      id: "projects",
      label: "Go to Projects",
      group: "Navigation",
      icon: <FolderKanban className="h-4 w-4" />,
      shortcut: "G P",
      onSelect: () => navigate("/projects"),
    },
    {
      id: "tasks",
      label: "Go to Tasks",
      group: "Navigation",
      icon: <Zap className="h-4 w-4" />,
      shortcut: "G T",
      onSelect: () => navigate("/tasks"),
    },
    {
      id: "new-idea",
      label: "New Idea",
      group: "Create",
      icon: <Plus className="h-4 w-4" />,
      shortcut: "N I",
      onSelect: () => navigate("/ideas/new"),
    },
    {
      id: "new-project",
      label: "New Project",
      group: "Create",
      icon: <Plus className="h-4 w-4" />,
      shortcut: "N P",
      onSelect: () => navigate("/projects/new"),
    },
  ];

  const groups = [...new Set(items.map((i) => i.group))];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-[--color-overlay] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={close}
          />

          {/* Panel */}
          <motion.div
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-[560px] -translate-x-1/2"
            {...motionPresets.fadeUp}
          >
            <Command
              className="rounded-xl border border-[--color-border] bg-[--color-panel] shadow-2xl overflow-hidden"
              loop
              shouldFilter
            >
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-[--color-border-subtle] px-4 py-3">
                <Search className="h-4 w-4 shrink-0 text-[--color-text-muted]" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search or jump to..."
                  className="flex-1 bg-transparent text-[13px] text-[--color-text-primary] placeholder:text-[--color-text-muted] outline-none"
                />
                <kbd className="hidden sm:inline-flex items-center rounded border border-[--color-border] bg-[--color-card] px-1.5 py-0.5 text-[11px] font-mono text-[--color-text-muted]">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <Command.List className="max-h-[320px] overflow-y-auto p-1.5">
                <Command.Empty className="py-10 text-center text-[13px] text-[--color-text-muted]">
                  No results for &ldquo;{search}&rdquo;
                </Command.Empty>

                {groups.map((group) => (
                  <Command.Group
                    key={group}
                    heading={group}
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[--color-text-muted] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
                  >
                    {items
                      .filter((i) => i.group === group)
                      .map((item) => (
                        <Command.Item
                          key={item.id}
                          value={item.label}
                          onSelect={item.onSelect}
                          className="flex items-center gap-3 rounded-md px-2.5 py-2 text-[13px] text-[--color-text-secondary] cursor-pointer transition-colors aria-selected:bg-[--color-primary-subtle] aria-selected:text-[--color-text-primary] hover:bg-[--color-card]"
                        >
                          <span className="text-[--color-text-muted]">{item.icon}</span>
                          <span className="flex-1">{item.label}</span>
                          <span className="flex items-center gap-1">
                            {item.shortcut && (
                              <kbd className="font-mono text-[11px] text-[--color-text-muted]">
                                {item.shortcut}
                              </kbd>
                            )}
                            <ArrowRight className="h-3 w-3 text-[--color-text-muted] opacity-0 group-aria-selected:opacity-100" />
                          </span>
                        </Command.Item>
                      ))}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
