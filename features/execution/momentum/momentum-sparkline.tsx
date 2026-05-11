"use client";

import { cn } from "@/lib/utils";

interface MomentumSparklineProps {
  data: number[];   // 7 values, 0-based, older → newer
  trend: "up" | "down" | "flat";
  className?: string;
}

export function MomentumSparkline({ data, trend, className }: MomentumSparklineProps) {
  const max = Math.max(...data, 1);
  const width = 56;
  const height = 20;
  const n = data.length;
  const step = width / (n - 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - (v / max) * (height - 2) - 1;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  const strokeColor =
    trend === "up"
      ? "var(--color-success)"
      : trend === "down"
      ? "var(--color-error)"
      : "var(--color-text-muted)";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      aria-hidden
    >
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />
      {/* Terminal dot */}
      {points[points.length - 1] && (
        <circle
          cx={(n - 1) * step}
          cy={height - ((data[n - 1] ?? 0) / max) * (height - 2) - 1}
          r={2}
          fill={strokeColor}
        />
      )}
    </svg>
  );
}
