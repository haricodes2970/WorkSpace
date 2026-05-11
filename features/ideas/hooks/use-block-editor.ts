"use client";

import { useCallback, useMemo, useReducer } from "react";
import type { BlockType } from "@prisma/client";
import {
  calculateReadiness,
  calculateHealthMetrics,
  type ReadinessScore,
  type IdeaHealthMetrics,
} from "../readiness/calculator";

// ─── State ────────────────────────────────────────────────────────────────

export interface BlockEditorBlock {
  id: string | null; // null = not yet persisted
  type: BlockType;
  content: string;
  completed: boolean;
  updatedAt: Date;
}

interface BlockEditorState {
  blocks: BlockEditorBlock[];
  collapsed: Set<BlockType>;
  activeBlock: BlockType | null;
  dirtyBlocks: Set<BlockType>;
}

// ─── Actions ──────────────────────────────────────────────────────────────

type Action =
  | { type: "SET_CONTENT"; blockType: BlockType; content: string }
  | { type: "SET_COMPLETED"; blockType: BlockType; completed: boolean }
  | { type: "TOGGLE_COLLAPSE"; blockType: BlockType }
  | { type: "SET_ACTIVE"; blockType: BlockType | null }
  | { type: "MARK_SAVED"; blockType: BlockType }
  | { type: "EXPAND_ALL" }
  | { type: "COLLAPSE_ALL" };

function reducer(state: BlockEditorState, action: Action): BlockEditorState {
  switch (action.type) {
    case "SET_CONTENT": {
      return {
        ...state,
        blocks: state.blocks.map((b) =>
          b.type === action.blockType
            ? { ...b, content: action.content, updatedAt: new Date() }
            : b
        ),
        dirtyBlocks: new Set([...state.dirtyBlocks, action.blockType]),
      };
    }
    case "SET_COMPLETED": {
      return {
        ...state,
        blocks: state.blocks.map((b) =>
          b.type === action.blockType
            ? { ...b, completed: action.completed }
            : b
        ),
      };
    }
    case "TOGGLE_COLLAPSE": {
      const next = new Set(state.collapsed);
      if (next.has(action.blockType)) next.delete(action.blockType);
      else next.add(action.blockType);
      return { ...state, collapsed: next };
    }
    case "SET_ACTIVE":
      return { ...state, activeBlock: action.blockType };
    case "MARK_SAVED": {
      const next = new Set(state.dirtyBlocks);
      next.delete(action.blockType);
      return { ...state, dirtyBlocks: next };
    }
    case "EXPAND_ALL":
      return { ...state, collapsed: new Set() };
    case "COLLAPSE_ALL":
      return {
        ...state,
        collapsed: new Set(state.blocks.map((b) => b.type)),
      };
    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export interface UseBlockEditorResult {
  blocks: BlockEditorBlock[];
  collapsed: Set<BlockType>;
  activeBlock: BlockType | null;
  dirtyBlocks: Set<BlockType>;
  readiness: ReadinessScore;
  health: IdeaHealthMetrics;
  setContent: (blockType: BlockType, content: string) => void;
  setCompleted: (blockType: BlockType, completed: boolean) => void;
  toggleCollapse: (blockType: BlockType) => void;
  setActive: (blockType: BlockType | null) => void;
  markSaved: (blockType: BlockType) => void;
  expandAll: () => void;
  collapseAll: () => void;
  expandBlock: (blockType: BlockType) => void;
}

export function useBlockEditor(
  initialBlocks: BlockEditorBlock[]
): UseBlockEditorResult {
  const [state, dispatch] = useReducer(reducer, {
    blocks: initialBlocks,
    collapsed: new Set<BlockType>(),
    activeBlock: null,
    dirtyBlocks: new Set<BlockType>(),
  });

  const readiness = useMemo(
    () =>
      calculateReadiness(
        state.blocks.map((b) => ({ type: b.type, content: b.content }))
      ),
    [state.blocks]
  );

  const health = useMemo(
    () =>
      calculateHealthMetrics(
        state.blocks.map((b) => ({ type: b.type, content: b.content })),
        readiness
      ),
    [state.blocks, readiness]
  );

  const setContent = useCallback(
    (blockType: BlockType, content: string) =>
      dispatch({ type: "SET_CONTENT", blockType, content }),
    []
  );
  const setCompleted = useCallback(
    (blockType: BlockType, completed: boolean) =>
      dispatch({ type: "SET_COMPLETED", blockType, completed }),
    []
  );
  const toggleCollapse = useCallback(
    (blockType: BlockType) => dispatch({ type: "TOGGLE_COLLAPSE", blockType }),
    []
  );
  const setActive = useCallback(
    (blockType: BlockType | null) => dispatch({ type: "SET_ACTIVE", blockType }),
    []
  );
  const markSaved = useCallback(
    (blockType: BlockType) => dispatch({ type: "MARK_SAVED", blockType }),
    []
  );
  const expandAll = useCallback(() => dispatch({ type: "EXPAND_ALL" }), []);
  const collapseAll = useCallback(() => dispatch({ type: "COLLAPSE_ALL" }), []);
  const expandBlock = useCallback(
    (blockType: BlockType) => {
      const collapsed = state.collapsed.has(blockType);
      if (collapsed) dispatch({ type: "TOGGLE_COLLAPSE", blockType });
    },
    [state.collapsed]
  );

  return {
    blocks: state.blocks,
    collapsed: state.collapsed,
    activeBlock: state.activeBlock,
    dirtyBlocks: state.dirtyBlocks,
    readiness,
    health,
    setContent,
    setCompleted,
    toggleCollapse,
    setActive,
    markSaved,
    expandAll,
    collapseAll,
    expandBlock,
  };
}
