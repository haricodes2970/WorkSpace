"use client";

import { Brain, TrendingUp, Shield, AlertCircle } from "lucide-react";
import type { BuilderDNA } from "../types";

interface DnaPanelProps {
  dna: BuilderDNA;
}

const velocityLabels: Record<string, string> = {
  SPRINTER:     "Sprinter",
  STEADY:       "Steady",
  SLOW_BURN:    "Slow Burn",
  INCONSISTENT: "Inconsistent",
};

const scopeLabels: Record<string, string> = {
  DISCIPLINED: "Disciplined",
  EXPANDER:    "Expander",
  INFLATOR:    "Inflator",
  CUTTER:      "Cutter",
};

const reviewLabels: Record<string, string> = {
  HIGH:     "High",
  MODERATE: "Moderate",
  LOW:      "Low",
  ABSENT:   "Absent",
};

const shipLabels: Record<string, string> = {
  SHIPS_FAST: "Ships Fast",
  SHIPS_SLOW: "Ships Slow",
  STALLS:     "Stalls",
  RESTARTS:   "Restarts",
};

function Badge({ label, positive }: { label: string; positive: boolean }) {
  return (
    <span className={`inline-flex text-xs px-2.5 py-0.5 rounded-full font-medium ${
      positive ? "bg-emerald-400/10 text-emerald-400" : "bg-white/10 text-white/60"
    }`}>
      {label}
    </span>
  );
}

export function DnaPanel({ dna }: DnaPanelProps) {
  const positiveVelocity = dna.velocityTendency === "SPRINTER" || dna.velocityTendency === "STEADY";
  const positiveScope    = dna.scopeHabit === "DISCIPLINED" || dna.scopeHabit === "CUTTER";
  const positiveReview   = dna.reviewConsistency === "HIGH" || dna.reviewConsistency === "MODERATE";
  const positiveShip     = dna.shippingBehavior === "SHIPS_FAST" || dna.shippingBehavior === "SHIPS_SLOW";

  return (
    <div className="space-y-4">
      {/* Profile headline */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-medium text-white">Builder Profile</span>
          <span className="text-xs text-white/30 ml-auto">{dna.projectsAnalyzed} projects analyzed</span>
        </div>
        <p className="text-sm text-white/70">{dna.strategicProfile}</p>
      </div>

      {/* Traits grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-1">
          <p className="text-xs text-white/40">Velocity</p>
          <Badge label={velocityLabels[dna.velocityTendency] ?? dna.velocityTendency} positive={positiveVelocity} />
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-1">
          <p className="text-xs text-white/40">Scope habit</p>
          <Badge label={scopeLabels[dna.scopeHabit] ?? dna.scopeHabit} positive={positiveScope} />
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-1">
          <p className="text-xs text-white/40">Reviews</p>
          <Badge label={reviewLabels[dna.reviewConsistency] ?? dna.reviewConsistency} positive={positiveReview} />
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-1">
          <p className="text-xs text-white/40">Shipping</p>
          <Badge label={shipLabels[dna.shippingBehavior] ?? dna.shippingBehavior} positive={positiveShip} />
        </div>
      </div>

      {/* Strengths */}
      {dna.strengths.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-white/60 uppercase tracking-wide">Strengths</span>
          </div>
          <ul className="space-y-1">
            {dna.strengths.map((s, i) => (
              <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">·</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Watch-outs */}
      {dna.watchOuts.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-3.5 w-3.5 text-yellow-400" />
            <span className="text-xs font-medium text-white/60 uppercase tracking-wide">Watch-outs</span>
          </div>
          <ul className="space-y-1">
            {dna.watchOuts.map((w, i) => (
              <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">·</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tendencies */}
      <div className="space-y-1.5">
        {dna.executionTendencies.map((t, i) => (
          <p key={i} className="text-xs text-white/40 leading-relaxed">{t}</p>
        ))}
      </div>
    </div>
  );
}
