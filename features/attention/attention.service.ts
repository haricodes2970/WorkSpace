import "server-only";
import { prisma } from "@/lib/prisma/client";
import type { UsageAggregate } from "@/platform/telemetry/telemetry-types";

export interface AttentionProfile {
  // Flow distribution across weeks
  avgDeepWorkPerWeek:  number;   // minutes
  avgFocusToggleRate:  number;   // toggles per session
  consistencyScore:    number;   // 0-100 (how regular is deep work?)
  bestWorkPeriod:      string | null; // "morning" | "afternoon" | "evening" based on session patterns

  // Trend — compared to prior 4 weeks
  trend: "improving" | "stable" | "declining";

  // Per-week heatmap data (last 8 weeks)
  weeklyData: WeeklyAttentionData[];
}

export interface WeeklyAttentionData {
  period:          string;
  deepWorkMinutes: number;
  sessionCount:    number;
  focusToggles:    number;
}

export async function getAttentionProfile(userId: string): Promise<AttentionProfile> {
  const snapshots = await prisma.usageSnapshot.findMany({
    where:   { userId },
    orderBy: { createdAt: "desc" },
    take:    8,
  });

  const weeklyData: WeeklyAttentionData[] = snapshots.map((s) => {
    const d = s.data as unknown as UsageAggregate;
    return {
      period:          s.period,
      deepWorkMinutes: d.deepWorkMinutes ?? 0,
      sessionCount:    d.sessionCount    ?? 0,
      focusToggles:    d.focusToggles    ?? 0,
    };
  });

  if (!weeklyData.length) {
    return {
      avgDeepWorkPerWeek: 0,
      avgFocusToggleRate: 0,
      consistencyScore:   0,
      bestWorkPeriod:     null,
      trend:              "stable",
      weeklyData:         [],
    };
  }

  const avgDeepWork = weeklyData.reduce((s, w) => s + w.deepWorkMinutes, 0) / weeklyData.length;
  const avgFocusToggleRate = weeklyData.reduce((s, w) => {
    return s + (w.sessionCount > 0 ? w.focusToggles / w.sessionCount : 0);
  }, 0) / weeklyData.length;

  // Consistency = coefficient of variation inverted (lower CV = more consistent)
  const mean   = avgDeepWork;
  const stdDev = Math.sqrt(
    weeklyData.reduce((s, w) => s + Math.pow(w.deepWorkMinutes - mean, 2), 0) / weeklyData.length
  );
  const cv           = mean > 0 ? stdDev / mean : 1;
  const consistency  = Math.round(Math.max(0, (1 - cv) * 100));

  // Trend: compare last 2 weeks to prior 2 weeks
  let trend: AttentionProfile["trend"] = "stable";
  if (weeklyData.length >= 4) {
    const recent = ((weeklyData[0]?.deepWorkMinutes ?? 0) + (weeklyData[1]?.deepWorkMinutes ?? 0)) / 2;
    const prior  = ((weeklyData[2]?.deepWorkMinutes ?? 0) + (weeklyData[3]?.deepWorkMinutes ?? 0)) / 2;
    if (recent > prior * 1.2) trend = "improving";
    else if (recent < prior * 0.8) trend = "declining";
  }

  return {
    avgDeepWorkPerWeek:  Math.round(avgDeepWork),
    avgFocusToggleRate:  Math.round(avgFocusToggleRate * 10) / 10,
    consistencyScore:    consistency,
    bestWorkPeriod:      null,   // would need per-hour data; future extension
    trend,
    weeklyData,
  };
}
