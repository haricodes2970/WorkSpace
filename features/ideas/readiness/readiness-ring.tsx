"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReadinessStatus } from "@prisma/client";

interface ReadinessRingProps {
  score: number;
  status: ReadinessStatus;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showScore?: boolean;
}

const STATUS_COLOR: Record<ReadinessStatus, string> = {
  CAPTURED:   "#4B5563",
  EXPLORING:  "#F59E0B",
  VALIDATING: "#06B6D4",
  PLANNING:   "#7C3AED",
  READY:      "#10B981",
  CONVERTED:  "#10B981",
  ARCHIVED:   "#374151",
};

export function ReadinessRing({
  score,
  status,
  size = 64,
  strokeWidth = 5,
  className,
  showScore = true,
}: ReadinessRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = STATUS_COLOR[status];
  const center = size / 2;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Readiness: ${score}%`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>

      {showScore && (
        <span
          className="absolute text-[11px] font-semibold tabular-nums"
          style={{ color }}
        >
          {score}
        </span>
      )}
    </div>
  );
}

// ─── Inline mini ring (for cards, sidebar) ────────────────────────────────

export function ReadinessRingMini({
  score,
  status,
  className,
}: Pick<ReadinessRingProps, "score" | "status" | "className">) {
  return (
    <ReadinessRing
      score={score}
      status={status}
      size={28}
      strokeWidth={3}
      showScore={false}
      className={className}
    />
  );
}
