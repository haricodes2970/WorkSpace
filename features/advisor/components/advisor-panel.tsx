"use client";

import { useState } from "react";
import { AlertTriangle, Brain, Scissors, ShieldAlert, BookOpen } from "lucide-react";
import type { AdvisorOutput } from "../types";
import { SignalCard } from "./signal-card";
import { SurvivabilityCard } from "./survivability-card";
import { CompressionSuggestions } from "./compression-suggestions";
import { DnaPanel } from "./dna-panel";

type Tab = "signals" | "survivability" | "compression" | "dna";

interface AdvisorPanelProps {
  output: AdvisorOutput;
}

const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: (o: AdvisorOutput) => number }[] = [
  {
    id:    "signals",
    label: "Signals",
    icon:  <AlertTriangle className="h-3.5 w-3.5" />,
    count: (o) => o.signals.filter((s) => s.severity === "critical").length || o.signals.length,
  },
  {
    id:    "survivability",
    label: "Risk",
    icon:  <ShieldAlert className="h-3.5 w-3.5" />,
    count: (o) => o.survivability.filter((s) => s.executionRisk === "HIGH" || s.executionRisk === "CRITICAL").length,
  },
  {
    id:    "compression",
    label: "Scope",
    icon:  <Scissors className="h-3.5 w-3.5" />,
    count: (o) => o.compression.length,
  },
  {
    id:    "dna",
    label: "DNA",
    icon:  <Brain className="h-3.5 w-3.5" />,
  },
];

export function AdvisorPanel({ output }: AdvisorPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("signals");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visibleSignals = output.signals.filter((s) => !dismissed.has(s.id));

  function handleDismiss(id: string) {
    setDismissed((prev) => new Set([...prev, id]));
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Brain className="h-5 w-5 text-violet-400" />
          Execution Advisor
        </h2>
        <p className="text-sm text-white/40 mt-0.5">
          Generated {output.generatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-1">
        {tabs.map((tab) => {
          const count = tab.count?.(output) ?? 0;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all flex-1 justify-center ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {tab.icon}
              {tab.label}
              {count > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center ${
                  isActive ? "bg-white/20 text-white" : "bg-white/10 text-white/40"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "signals" && (
        <div className="space-y-3">
          {visibleSignals.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/40">No active signals.</p>
            </div>
          ) : (
            visibleSignals
              .sort((a, b) => {
                const order = { critical: 0, warning: 1, info: 2 };
                return order[a.severity] - order[b.severity];
              })
              .map((s) => (
                <SignalCard key={s.id} signal={s} onDismiss={handleDismiss} />
              ))
          )}
        </div>
      )}

      {activeTab === "survivability" && (
        <div className="space-y-3">
          {output.survivability.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center">
              <ShieldAlert className="h-8 w-8 text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/40">No active projects to analyze.</p>
            </div>
          ) : (
            output.survivability
              .sort((a, b) => b.abandonmentProbability - a.abandonmentProbability)
              .map((r) => <SurvivabilityCard key={r.projectId} result={r} />)
          )}
        </div>
      )}

      {activeTab === "compression" && (
        <CompressionSuggestions results={output.compression} />
      )}

      {activeTab === "dna" && (
        output.dna ? (
          <DnaPanel dna={output.dna} />
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center">
            <Brain className="h-8 w-8 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/40">Need 2+ projects for DNA analysis.</p>
            <p className="text-xs text-white/25 mt-1">Ship or complete more projects to unlock behavioral profiling.</p>
          </div>
        )
      )}
    </div>
  );
}
