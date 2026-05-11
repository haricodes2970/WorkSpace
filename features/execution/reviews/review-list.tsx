"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronDown, ChevronRight, Plus, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReviewForm } from "./review-form";
import type { ReviewFormData } from "./review-form";

// ─── Types ────────────────────────────────────────────────────────────────

export interface ReviewData {
  id: string;
  weekStarting: Date;
  movedForward: string;
  stalled: string;
  changed: string;
  assumptionsFailed: string;
  shouldCut: string;
  worthContinuing: boolean;
  overallRating: number;
  createdAt: Date;
}

interface ReviewListProps {
  reviews: ReviewData[];
  onSubmitReview: (data: ReviewFormData) => Promise<void>;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function getThisWeekStart(): Date {
  const d = new Date();
  // Monday
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeek(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────

export function ReviewList({ reviews, onSubmitReview, className }: ReviewListProps) {
  const thisWeek = getThisWeekStart();

  const hasThisWeek = reviews.some(
    (r) => r.weekStarting.toDateString() === thisWeek.toDateString()
  );

  const [showForm, setShowForm] = useState(false);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] text-[--color-text-muted] uppercase tracking-wider font-medium">
          Weekly Reviews
        </span>
        {!hasThisWeek && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-[11px] text-[--color-primary] hover:opacity-80 transition-opacity"
          >
            <Plus className="h-3 w-3" />
            This week
          </button>
        )}
      </div>

      {/* This-week CTA */}
      {!hasThisWeek && !showForm && (
        <motion.button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-3 rounded-lg border border-dashed border-[--color-border] bg-[--color-card] px-4 py-3 hover:border-[--color-primary]/40 hover:bg-[--color-card-hover] transition-colors text-left"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="h-7 w-7 rounded-lg bg-[--color-primary]/10 border border-[--color-primary]/20 flex items-center justify-center shrink-0">
            <Plus className="h-3.5 w-3.5 text-[--color-primary]" />
          </div>
          <div>
            <p className="text-[12px] font-medium text-[--color-text-secondary]">
              Weekly review — {formatWeek(thisWeek)}
            </p>
            <p className="text-[10px] text-[--color-text-muted] mt-0.5">
              5 questions · 5 minutes · forces strategic reflection
            </p>
          </div>
        </motion.button>
      )}

      {/* Review form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-[--color-primary]/30 bg-[--color-card] p-4">
              <ReviewForm
                weekStarting={thisWeek}
                onSubmit={async (data) => {
                  await onSubmitReview(data);
                  setShowForm(false);
                }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review history */}
      {reviews.length === 0 && !showForm && (
        <div className="flex flex-col items-center py-8 text-center">
          <p className="text-[11px] text-[--color-text-muted]">
            No reviews yet. First review builds the habit.
          </p>
        </div>
      )}

      {reviews.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {reviews.map((review, i) => (
            <ReviewCard key={review.id} review={review} animDelay={i * 0.04} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Review card ──────────────────────────────────────────────────────────

function ReviewCard({ review, animDelay }: { review: ReviewData; animDelay: number }) {
  const [expanded, setExpanded] = useState(false);

  const sections: { label: string; value: string; icon?: React.ReactNode }[] = [
    { label: "Moved forward", value: review.movedForward },
    { label: "Stalled", value: review.stalled },
    { label: "Changed", value: review.changed },
    { label: "Failed assumptions", value: review.assumptionsFailed },
    { label: "Should cut", value: review.shouldCut },
  ].filter((s) => s.value.trim());

  return (
    <motion.div
      className="rounded-lg border border-[--color-border] bg-[--color-card] overflow-hidden"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animDelay, duration: 0.15 }}
    >
      {/* Card header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 hover:bg-[--color-card-hover] transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-[--color-text-muted] shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-[--color-text-muted] shrink-0" />
        )}

        <div className="flex-1 text-left">
          <span className="text-[12px] font-medium text-[--color-text-secondary]">
            Week of {formatWeek(review.weekStarting)}
          </span>
        </div>

        <StarRatingDisplay value={review.overallRating} />

        {review.worthContinuing ? (
          <CheckCircle className="h-3.5 w-3.5 text-[--color-success] shrink-0" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 text-[--color-warning] shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-[--color-border-subtle] flex flex-col gap-2.5">
              {sections.map((s) => (
                <div key={s.label}>
                  <p className="text-[10px] font-medium text-[--color-text-muted] uppercase tracking-wide mb-0.5">
                    {s.label}
                  </p>
                  <p className="text-[12px] text-[--color-text-secondary] whitespace-pre-wrap leading-relaxed">
                    {s.value}
                  </p>
                </div>
              ))}
              {!review.worthContinuing && (
                <div className="flex items-start gap-2 rounded-md bg-[--color-warning]/10 border border-[--color-warning]/20 px-3 py-2 mt-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-[--color-warning] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[--color-warning]">
                    Marked for reconsideration this week
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StarRatingDisplay({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "h-3 w-3",
            s <= value
              ? "text-[--color-warning] fill-[--color-warning]"
              : "text-[--color-border]"
          )}
        />
      ))}
    </div>
  );
}
