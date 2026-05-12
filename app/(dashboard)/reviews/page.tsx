import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAuthUser } from "@/services/auth.service";
import { getStrategicReviews } from "@/features/reviews/review.service";
import { ReviewList } from "@/features/reviews/components/review-list";

export const metadata: Metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  const user    = await requireAuthUser();
  const reviews = await getStrategicReviews(user.profile.id);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Strategic Reviews</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Monthly, quarterly, and annual execution reflection
          </p>
        </div>
        <Link
          href="/reviews/new"
          className="flex items-center gap-1.5 rounded-lg bg-[--color-primary] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          New review
        </Link>
      </div>

      <ReviewList reviews={reviews} />
    </div>
  );
}
