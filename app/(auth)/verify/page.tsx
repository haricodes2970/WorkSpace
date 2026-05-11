import { Suspense } from "react";
import type { Metadata } from "next";
import { VerifyForm } from "@/features/auth/components/verify-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Verify OTP",
};

export default function VerifyPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[260px] w-full rounded-xl" />}>
      <VerifyForm />
    </Suspense>
  );
}
