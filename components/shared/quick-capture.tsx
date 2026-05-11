"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, X, Tag, ArrowRight } from "lucide-react";
import { motionPresets } from "@/lib/design-tokens";
import { Button } from "@/components/ui/button";

interface QuickCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Server action or handler — passed in, not imported */
  onSubmit: (data: { title: string; tags: string[] }) => void | Promise<void>;
}

export function QuickCapture({ open, onOpenChange, onSubmit }: QuickCaptureProps) {
  const [title, setTitle] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setTitle("");
      setTagInput("");
      setTags([]);
    }
  }, [open]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onOpenChange]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), tags });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

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
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            className="fixed left-1/2 top-[25%] z-50 w-full max-w-[480px] -translate-x-1/2"
            {...motionPresets.fadeUp}
          >
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-[--color-border] bg-[--color-panel] shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-[--color-border-subtle] px-4 py-3">
                <Lightbulb className="h-4 w-4 text-[--color-warning] shrink-0" />
                <span className="text-[12px] font-medium text-[--color-text-muted] uppercase tracking-wider">
                  Capture Idea
                </span>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="ml-auto text-[--color-text-muted] hover:text-[--color-text-primary] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Title input */}
              <div className="px-4 pt-4 pb-3">
                <input
                  ref={inputRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's the idea?"
                  className="w-full bg-transparent text-[16px] font-medium text-[--color-text-primary] placeholder:text-[--color-text-muted] outline-none resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.preventDefault();
                  }}
                />
              </div>

              {/* Tags */}
              <div className="px-4 pb-4 flex flex-wrap items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-[--color-text-muted] shrink-0" />
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full border border-[--color-border] bg-[--color-card] px-2 py-0.5 text-[11px] text-[--color-text-secondary]"
                  >
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>
                      <X className="h-2.5 w-2.5 text-[--color-text-muted] hover:text-[--color-text-primary]" />
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder={tags.length === 0 ? "Add tags..." : ""}
                  className="bg-transparent text-[12px] text-[--color-text-secondary] placeholder:text-[--color-text-muted] outline-none min-w-[80px]"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-[--color-border-subtle] px-4 py-3 bg-[--color-card]/50">
                <span className="text-[11px] text-[--color-text-muted]">
                  Press Enter to save · Esc to dismiss
                </span>
                <Button
                  type="submit"
                  size="sm"
                  loading={saving}
                  disabled={!title.trim()}
                  className="gap-1.5 text-[12px] h-7"
                >
                  Capture
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
