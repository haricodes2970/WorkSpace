"use client";

import { useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import type { BlockType } from "@prisma/client";
import { ThinkingBlock } from "./thinking-block";
import { BLOCK_DEFINITIONS } from "./block-types";
import type { UseBlockEditorResult } from "../hooks/use-block-editor";
import type { SaveStatus } from "../hooks/use-autosave";

interface BlocksEditorProps {
  editor: UseBlockEditorResult;
  blockSaveStatus: Map<BlockType, SaveStatus>;
  onContentChange: (blockType: BlockType, content: string) => void;
  readOnly?: boolean;
}

export function BlocksEditor({
  editor,
  blockSaveStatus,
  onContentChange,
  readOnly = false,
}: BlocksEditorProps) {
  const { blocks, collapsed, activeBlock, setActive, toggleCollapse, setContent } = editor;

  // Keyboard: Tab navigates between blocks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const defs = BLOCK_DEFINITIONS;
      const currentIndex = defs.findIndex((d) => d.type === activeBlock);
      if (e.key === "ArrowDown" && currentIndex < defs.length - 1) {
        e.preventDefault();
        const nextType = defs[currentIndex + 1]?.type;
        if (nextType) {
          editor.expandBlock(nextType);
          setActive(nextType);
          setTimeout(() => {
            document.getElementById(`block-${nextType}`)?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }, 100);
        }
      }
      if (e.key === "ArrowUp" && currentIndex > 0) {
        e.preventDefault();
        const prevType = defs[currentIndex - 1]?.type;
        if (prevType) {
          editor.expandBlock(prevType);
          setActive(prevType);
          setTimeout(() => {
            document.getElementById(`block-${prevType}`)?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }, 100);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeBlock, editor, setActive]);

  const handleChange = useCallback(
    (blockType: BlockType, content: string) => {
      setContent(blockType, content);
      onContentChange(blockType, content);
    },
    [setContent, onContentChange]
  );

  const blockMap = new Map(blocks.map((b) => [b.type, b]));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1 px-1">
        <span className="text-[11px] text-[--color-text-muted] uppercase tracking-wider font-medium">
          Thinking Blocks
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={editor.expandAll}
            className="text-[11px] text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors"
          >
            Expand all
          </button>
          <span className="text-[--color-text-muted] opacity-30">·</span>
          <button
            type="button"
            onClick={editor.collapseAll}
            className="text-[11px] text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors"
          >
            Collapse all
          </button>
          <span className="text-[11px] text-[--color-text-muted] ml-1">
            Alt+↑↓ to navigate
          </span>
        </div>
      </div>

      {BLOCK_DEFINITIONS.map((def) => {
        const block = blockMap.get(def.type);
        return (
          <div key={def.type} id={`block-${def.type}`}>
            <ThinkingBlock
              def={def}
              content={block?.content ?? ""}
              completed={block?.completed ?? false}
              collapsed={collapsed.has(def.type)}
              active={activeBlock === def.type}
              saveStatus={blockSaveStatus.get(def.type)}
              onChange={(content) => handleChange(def.type, content)}
              onToggleCollapse={() => toggleCollapse(def.type)}
              onFocus={() => setActive(def.type)}
              onBlur={() => setActive(null)}
            />
          </div>
        );
      })}
    </div>
  );
}
