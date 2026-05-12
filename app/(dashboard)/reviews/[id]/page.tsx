import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAuthUser } from "@/services/auth.service";
import { getStrategicReview } from "@/features/reviews/review.service";
import { ReviewSnapshot } from "@/features/reviews/components/review-snapshot";

export const metadata: Metadata = { title: "Review" };

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user   = await requireAuthUser();
  const review = await getStrategicReview(id, user.profile.id);

  if (!review) notFound();

  const TYPE_LABELS: Record<string, string> = {
    MONTHLY:          "Monthly Review",
    QUARTERLY:        "Quarterly Review",
    ANNUAL:           "Annual Review",
    PORTFOLIO:        "Portfolio Review",
    EXECUTION_HEALTH: "Execution Health Check",
    IDEA_CEMETERY:    "Idea Audit",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/reviews" className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-white">
            {TYPE_LABELS[review.type] ?? review.type}
          </h1>
          <p className="text-sm text-white/40 mt-0.5">
            {review.period} · {review.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Review content */}
      <div className="space-y-6">
        {review.wins && (
          <Section title="Wins" body={review.wins} color="text-emerald-400" />
        )}
        {review.struggles && (
          <Section title="Struggles" body={review.struggles} color="text-orange-400" />
        )}
        {review.patterns && (
          <Section title="Patterns" body={review.patterns} color="text-blue-400" />
        )}
        {review.nextFocus && (
          <Section title="Next Focus" body={review.nextFocus} color="text-violet-400" />
        )}
      </div>

      {/* Snapshot */}
      {review.snapshot && <ReviewSnapshot snapshot={review.snapshot} />}
    </div>
  );
}

function Section({ title, body, color }: { title: string; body: string; color: string }) {
  const lines = body.split("\n").filter(Boolean);
  return (
    <div className="space-y-2">
      <p className={`text-xs font-medium uppercase tracking-wide ${color}`}>{title}</p>
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-1">
        {lines.map((line, i) => (
          <p key={i} className="text-sm text-white/70 leading-relaxed">{line}</p>
        ))}
      </div>
    </div>
  );
}
