"use client";

import { Layers, X, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useWorkingSet } from "@/features/working-set/working-set-context";
import { ClusterPanel }  from "@/features/working-set/components/cluster-panel";
import { motionPresets } from "@/lib/design-tokens";

export function WorkingSetPanel() {
  const { entries, clear, isOpen, setOpen } = useWorkingSet();

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-1.5 rounded-full border border-[--color-border] bg-[--color-panel] px-3 py-1.5 text-[12px] text-[--color-text-secondary] shadow-lg transition-colors hover:bg-[--color-card] hover:text-[--color-text-primary]"
        aria-label="Working set"
      >
        <Layers className="h-3.5 w-3.5" />
        {entries.length > 0 && (
          <span className="min-w-[16px] rounded-full bg-[--color-primary] px-1 text-center text-[10px] font-medium text-white">
            {entries.length}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed bottom-16 right-6 z-40 w-64 rounded-xl border border-[--color-border] bg-[--color-panel] shadow-2xl overflow-hidden"
              {...motionPresets.fadeUp}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-[--color-border-subtle]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[--color-text-muted]">
                  Working Set
                </span>
                <div className="flex items-center gap-1">
                  {entries.length > 0 && (
                    <button
                      onClick={clear}
                      className="rounded p-1 text-[--color-text-muted] hover:text-[--color-text-primary] transition-colors"
                      aria-label="Clear working set"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded p-1 text-[--color-text-muted] hover:text-[--color-text-primary] transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Items — clustered */}
              <div className="p-1.5 max-h-72 overflow-y-auto">
                <ClusterPanel />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
