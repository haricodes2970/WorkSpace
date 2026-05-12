"use client";

import { AlertTriangle, CheckCircle, TrendingDown, Zap } from "lucide-react";
import type { SurvivabilityResult, ExecutionRisk } from "../types";

interface SurvivabilityCardProps {
  result: SurvivabilityResult;
}

const riskConfig: Record<ExecutionRisk, { label: string; color: string; icon: React.ReactNode }> = {
  LOW:      { label: "Low Risk",      color: "text-emerald-400", icon: <CheckCircle className="h-4 w-4" /> },
  MODERATE: { label: "Moderate Risk", color: "text-yellow-400",  icon: <TrendingDown className="h-4 w-4" /> },
  HIGH:     { label: "High Risk",     color: "text-orange-400",  icon: <AlertTriangle className="h-4 w-4" /> },
  CRITICAL: { label: "Critical",      color: "text-red-400",     icon: <Zap className="h-4 w-4" /> },
};

export function SurvivabilityCard({ result }: SurvivabilityCardProps) {
  const cfg = riskConfig[result.executionRisk];
  const pct = result.abandonmentProbability;

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{result.projectTitle}</p>
          <p className="text-xs text-white/40 mt-0.5">{result.primaryThreat}</p>
        </div>
        <div className={`flex items-center gap-1 shrink-0 ${cfg.color}`}>
          {cfg.icon}
          <span className="text-xs font-medium">{cfg.label}</span>
        </div>
      </div>

      {/* Abandonment bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-white/40">
          <span>Abandonment risk</span>
          <span className={cfg.color}>{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              pct >= 70 ? "bg-red-500" : pct >= 40 ? "bg-orange-500" : pct >= 20 ? "bg-yellow-500" : "bg-emerald-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Risk factors */}
      {result.riskFactors.length > 0 && (
        <div className="space-y-1">
          {result.riskFactors.slice(0, 3).map((rf, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-white/50">{rf.label}</span>
              <div className="flex items-center gap-1.5">
                <div className="h-1 w-16 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white/30"
                    style={{ width: `${rf.weight}%` }}
                  />
                </div>
                <span className="text-white/30 w-6 text-right">{rf.weight}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
