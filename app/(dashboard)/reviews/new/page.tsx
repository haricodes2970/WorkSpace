"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReviewPeriodPicker, ReviewForm } from "@/features/reviews/components/review-form";
import type { StrategicReviewKind } from "@/features/reviews/types";

interface SelectedPeriod {
  type:        StrategicReviewKind;
  period:      string;
  periodStart: string;
  periodEnd:   string;
}

export default function NewReviewPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<SelectedPeriod | null>(null);

  if (!selected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/reviews" className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-white">New Review</h1>
            <p className="text-sm text-white/40 mt-0.5">Choose a review type to begin</p>
          </div>
        </div>
        <ReviewPeriodPicker
          onSelect={(type, period, start, end) =>
            setSelected({ type, period, periodStart: start, periodEnd: end })
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSelected(null)}
          className="text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-white">Write Review</h1>
          <p className="text-sm text-white/40 mt-0.5">{selected.period}</p>
        </div>
      </div>
      <ReviewForm
        {...selected}
        onSaved={() => router.push("/reviews")}
      />
    </div>
  );
}
