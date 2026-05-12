import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAuthUser } from "@/services/auth.service";
import { getAdvisorOutput } from "@/features/advisor/advisor.service";
import { AdvisorPanel } from "@/features/advisor/components/advisor-panel";
import { AdvisorSkeleton } from "./loading";

export const metadata: Metadata = { title: "Advisor" };

async function AdvisorContent() {
  const user = await requireAuthUser();
  const output = await getAdvisorOutput(user.profile.id);
  return <AdvisorPanel output={output} />;
}

export default function AdvisorPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Suspense fallback={<AdvisorSkeleton />}>
        <AdvisorContent />
      </Suspense>
    </div>
  );
}
