"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { motionPresets } from "@/lib/design-tokens";

interface EntityPeekProps {
  children:  ReactNode;  // the trigger element
  peek:      ReactNode;  // the preview content
  disabled?: boolean;
}

export function EntityPeek({ children, peek, disabled = false }: EntityPeekProps) {
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (disabled) return;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(true);
  }, [disabled]);

  const hide = useCallback(() => {
    hideTimer.current = setTimeout(() => setVisible(false), 120);
  }, []);

  const cancelHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  return (
    <span className="relative inline-block" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            className="absolute left-0 top-full z-50 mt-1.5 w-72"
            {...motionPresets.fadeUp}
            onMouseEnter={cancelHide}
            onMouseLeave={hide}
          >
            <div className="rounded-xl border border-[--color-border] bg-[--color-panel] p-3 shadow-2xl text-[12px]">
              {peek}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

// Convenience: project peek card
interface ProjectPeekCardProps {
  title:     string;
  phase?:    string | null;
  momentum?: string | null;
  updatedAt?: Date | string;
}

export function ProjectPeekCard({ title, phase, momentum, updatedAt }: ProjectPeekCardProps) {
  return (
    <div className="space-y-1.5">
      <p className="font-medium text-[--color-text-primary] leading-snug">{title}</p>
      <div className="flex items-center gap-2 flex-wrap">
        {phase && (
          <span className="text-[10px] bg-[--color-card] border border-[--color-border] rounded px-1.5 py-0.5 text-[--color-text-muted] font-mono">
            {phase.replace("_", " ")}
          </span>
        )}
        {momentum && (
          <span className="text-[10px] text-[--color-text-muted]">{momentum.toLowerCase()} momentum</span>
        )}
      </div>
      {updatedAt && (
        <p className="text-[10px] text-[--color-text-muted]">
          Updated {new Date(updatedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
