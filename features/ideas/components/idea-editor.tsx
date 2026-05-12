"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag, X, Clock, AlertCircle, Check, Archive, Rocket,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatRelativeTime } from "@/lib/utils";
import { motionPresets } from "@/lib/design-tokens";
import { useBlockEditor } from "../hooks/use-block-editor";
import { useAutosave } from "../hooks/use-autosave";
import { BlocksEditor } from "../blocks/blocks-editor";
import { ReadinessRing } from "../readiness/readiness-ring";
import { ReadinessBreakdown } from "../readiness/readiness-breakdown";
import { IdeaHealthPanel } from "../readiness/idea-health-panel";
import { RelationshipsPanel } from "./relationships-panel";
import { ConversionGate } from "../conversion/conversion-gate";
import { parseMvpScopeToTasks } from "../readiness/calculator";
import type { BlockType, IdeaStatus, ReadinessStatus, RelationshipType } from "@prisma/client";
import type { BlockEditorBlock } from "../hooks/use-block-editor";
import type { IdeaRelationshipItem } from "./relationships-panel";
import type { ConversionConfig } from "../conversion/conversion-gate";
import type { SaveStatus } from "../hooks/use-autosave";

// ─── Types ────────────────────────────────────────────────────────────────

export interface IdeaEditorData {
  id: string;
  title: string;
  status: IdeaStatus;
  readinessStatus: ReadinessStatus;
  readinessScore: number;
  tags: string[];
  pinned: boolean;
  updatedAt: Date;
  blocks: BlockEditorBlock[];
  relationships: IdeaRelationshipItem[];
}

interface IdeaEditorProps {
  idea: IdeaEditorData;
  onSaveBlock: (blockType: BlockType, content: string) => Promise<void>;
  onSaveMeta: (data: { title?: string; tags?: string[] }) => Promise<void>;
  onConvert: (config: ConversionConfig) => Promise<void>;
  onArchive: () => void;
  onAddRelationship: (relatedIdeaId: string, type: RelationshipType) => void;
  onRemoveRelationship: (id: string) => void;
  readOnly?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────

export function IdeaEditor({
  idea,
  onSaveBlock,
  onSaveMeta,
  onConvert,
  onArchive,
  onAddRelationship,
  onRemoveRelationship,
  readOnly = false,
}: IdeaEditorProps) {
  const editor = useBlockEditor(idea.blocks);

  const [title, setTitle] = useState(idea.title);
  const [tags, setTags] = useState<string[]>(idea.tags);
  const [tagInput, setTagInput] = useState("");
  const [showConversionGate, setShowConversionGate] = useState(false);
  const [rightTab, setRightTab] = useState<"readiness" | "health" | "relations">("readiness");

  // Per-block autosave tracking
  const [blockSaveStatus, setBlockSaveStatus] = useState<Map<BlockType, SaveStatus>>(new Map());

  const pendingBlocks = useRef<Map<BlockType, ReturnType<typeof setTimeout>>>(new Map());

  // Title autosave
  const { status: titleSaveStatus } = useAutosave({
    value: title,
    onSave: async () => {
      await onSaveMeta({ title, tags });
    },
    delay: 1500,
  });

  const handleBlockChange = useCallback(
    (blockType: BlockType, content: string) => {
      // Debounce per-block
      clearTimeout(pendingBlocks.current.get(blockType));
      setBlockSaveStatus((prev) => new Map(prev).set(blockType, "saving"));

      const t = setTimeout(async () => {
        try {
          await onSaveBlock(blockType, content);
          setBlockSaveStatus((prev) => new Map(prev).set(blockType, "saved"));
          setTimeout(() => {
            setBlockSaveStatus((prev) => {
              const next = new Map(prev);
              next.delete(blockType);
              return next;
            });
          }, 2000);
        } catch {
          setBlockSaveStatus((prev) => new Map(prev).set(blockType, "error"));
        }
        pendingBlocks.current.delete(blockType);
      }, 1200);

      pendingBlocks.current.set(blockType, t);
    },
    [onSaveBlock]
  );

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 10) {
      const next = [...tags, t];
      setTags(next);
      onSaveMeta({ title, tags: next });
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    const next = tags.filter((t) => t !== tag);
    setTags(next);
    onSaveMeta({ title, tags: next });
  };

  const mvpContent = editor.blocks.find((b) => b.type === "MVP_SCOPE")?.content ?? "";
  const taskSeeds = parseMvpScopeToTasks(mvpContent);

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Main editor area ── */}
      <div className="flex-1 min-w-0 overflow-y-auto">

        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-[--color-bg] border-b border-[--color-border-subtle] px-6 py-4">
          <div className="flex items-start justify-between gap-4 max-w-3xl">
            <div className="flex-1 min-w-0">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Idea title…"
                disabled={readOnly}
                className="w-full bg-transparent text-[22px] font-semibold text-[--color-text-primary] placeholder:text-[--color-text-muted] outline-none"
              />
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <Badge
                  variant={
                    idea.status === "READY" ? "success"
                    : idea.status === "REFINING" ? "warning"
                    : idea.status === "CONVERTED" ? "primary"
                    : idea.status === "ARCHIVED" ? "outline"
                    : "default"
                  }
                  dot
                  className="text-[11px]"
                >
                  {idea.status.charAt(0) + idea.status.slice(1).toLowerCase()}
                </Badge>
                <span className="text-[11px] text-[--color-text-muted] flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(idea.updatedAt)}
                </span>
                <AutoSaveIndicator status={titleSaveStatus} />
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {editor.readiness.canConvert && idea.status !== "CONVERTED" && (
                <Button
                  size="sm"
                  onClick={() => setShowConversionGate(true)}
                  className="gap-1.5 text-[12px] h-7"
                >
                  <Rocket className="h-3.5 w-3.5" />
                  Convert
                </Button>
              )}
              {!readOnly && (
                <button
                  onClick={onArchive}
                  className="p-1.5 rounded-md text-[--color-text-muted] hover:text-[--color-text-secondary] hover:bg-[--color-card] transition-colors"
                  title="Archive"
                >
                  <Archive className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Tags */}
          {!readOnly && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3 max-w-3xl">
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
                placeholder={tags.length === 0 ? "Add tags…" : ""}
                className="bg-transparent text-[12px] text-[--color-text-secondary] placeholder:text-[--color-text-muted] outline-none min-w-[80px]"
              />
            </div>
          )}
        </div>

        {/* Block editor */}
        <div className="px-6 py-5 max-w-3xl">
          <BlocksEditor
            editor={editor}
            blockSaveStatus={blockSaveStatus}
            onContentChange={handleBlockChange}
            readOnly={readOnly}
          />
        </div>
      </div>

      {/* ── Right panel ── */}
      <aside className="hidden xl:flex w-64 flex-col border-l border-[--color-border-subtle] bg-[--color-panel] shrink-0 overflow-y-auto">

        {/* Readiness ring header */}
        <div className="p-4 border-b border-[--color-border-subtle] flex items-center gap-3">
          <ReadinessRing
            score={editor.readiness.total}
            status={editor.readiness.status}
            size={48}
            strokeWidth={4}
          />
          <div>
            <p className="text-[13px] font-semibold text-[--color-text-primary]">
              {editor.readiness.total}/100
            </p>
            <p className="text-[11px] text-[--color-text-muted] capitalize">
              {editor.readiness.status.toLowerCase().replace("_", " ")}
            </p>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex border-b border-[--color-border-subtle]">
          {(["readiness", "health", "relations"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setRightTab(tab)}
              className={cn(
                "flex-1 py-2 text-[10px] font-medium uppercase tracking-wide transition-colors",
                rightTab === tab
                  ? "text-[--color-text-primary] border-b-2 border-[--color-primary] -mb-px"
                  : "text-[--color-text-muted] hover:text-[--color-text-secondary]"
              )}
            >
              {tab === "readiness" ? "Score" : tab === "health" ? "Health" : "Links"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-3">
          {rightTab === "readiness" && (
            <div className="flex flex-col gap-3">
              <ReadinessBreakdown readiness={editor.readiness} />
              {editor.readiness.canConvert && idea.status !== "CONVERTED" && (
                <motion.div {...motionPresets.fadeUp}>
                  <Button
                    size="sm"
                    onClick={() => setShowConversionGate(true)}
                    className="w-full gap-1.5 text-[12px] h-8"
                  >
                    <Rocket className="h-3.5 w-3.5" />
                    Convert to Project
                  </Button>
                </motion.div>
              )}
            </div>
          )}

          {rightTab === "health" && (
            <IdeaHealthPanel health={editor.health} />
          )}

          {rightTab === "relations" && (
            <RelationshipsPanel
              relationships={idea.relationships}
              onAdd={readOnly ? undefined : onAddRelationship}
              onRemove={readOnly ? undefined : onRemoveRelationship}
            />
          )}
        </div>

        {/* Metadata footer */}
        <div className="p-3 border-t border-[--color-border-subtle] flex flex-col gap-1.5">
          <p className="text-[10px] font-medium text-[--color-text-muted] uppercase tracking-wide mb-0.5">
            Metadata
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[--color-text-muted]">Status</span>
            <Badge
              variant={
                idea.status === "READY" ? "success"
                : idea.status === "REFINING" ? "warning"
                : idea.status === "CONVERTED" ? "primary"
                : "default"
              }
              dot
              className="text-[10px]"
            >
              {idea.status.charAt(0) + idea.status.slice(1).toLowerCase()}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[--color-text-muted]">Updated</span>
            <span className="text-[11px] text-[--color-text-muted]">
              {formatRelativeTime(idea.updatedAt)}
            </span>
          </div>
        </div>
      </aside>

      {/* Conversion gate modal */}
      <AnimatePresence>
        {showConversionGate && (
          <ConversionGate
            ideaTitle={title}
            readiness={editor.readiness}
            taskSeeds={taskSeeds}
            onConvert={async (config) => {
              await onConvert(config);
              setShowConversionGate(false);
            }}
            onClose={() => setShowConversionGate(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Save status indicator ────────────────────────────────────────────────

function AutoSaveIndicator({ status }: { status: SaveStatus }) {
  return (
    <AnimatePresence mode="wait">
      {status === "saving" && (
        <motion.span key="saving" {...motionPresets.fadeIn} className="flex items-center gap-1 text-[11px] text-[--color-text-muted]">
          <span className="h-1.5 w-1.5 rounded-full bg-[--color-text-muted] animate-pulse-subtle" />
          Saving…
        </motion.span>
      )}
      {status === "saved" && (
        <motion.span key="saved" {...motionPresets.fadeIn} className="flex items-center gap-1 text-[11px] text-[--color-success]">
          <Check className="h-3 w-3" />
          Saved
        </motion.span>
      )}
      {status === "error" && (
        <motion.span key="error" {...motionPresets.fadeIn} className="flex items-center gap-1 text-[11px] text-red-400">
          <AlertCircle className="h-3 w-3" />
          Error
        </motion.span>
      )}
    </AnimatePresence>
  );
}
