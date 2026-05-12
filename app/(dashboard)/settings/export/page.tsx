"use client";

import { useState, useTransition } from "react";
import { Download, Loader2, CheckCircle, Shield } from "lucide-react";

export default function ExportPage() {
  const [done, setDone]   = useState(false);
  const [isPending, start] = useTransition();

  function handleExport() {
    start(async () => {
      // Trigger download via anchor + API route
      const a    = document.createElement("a");
      a.href     = "/api/export?format=json";
      a.download = `workspace-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    });
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Export Workspace</h1>
        <p className="text-sm text-white/40 mt-1">
          Download a complete backup of your data — ideas, projects, memories, and reviews.
        </p>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white">Your data, always portable</p>
            <p className="text-sm text-white/50 mt-1 leading-relaxed">
              Exports include all ideas, projects, tasks, milestones, decisions, weekly reviews,
              scope items, memories, and strategic reviews — with all relationships and metadata preserved.
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Format</span>
            <span className="text-white font-mono text-xs bg-white/10 px-2 py-0.5 rounded">JSON v1.0</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Re-importable</span>
            <span className="text-emerald-400 text-xs">Yes</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Relationships preserved</span>
            <span className="text-emerald-400 text-xs">Yes</span>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-[--color-primary] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Preparing export…</>
          ) : done ? (
            <><CheckCircle className="h-4 w-4" /> Download started</>
          ) : (
            <><Download className="h-4 w-4" /> Export workspace</>
          )}
        </button>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
        <p className="text-xs font-medium text-white/60">Re-import</p>
        <p className="text-xs text-white/40 leading-relaxed">
          To import a WorkSpace JSON export into a new account, use the import flow at{" "}
          <span className="font-mono text-white/60">/settings/import</span>.
          Existing records with matching IDs are skipped — no duplicates.
        </p>
      </div>
    </div>
  );
}
