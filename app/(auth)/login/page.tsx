import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[220px] w-full rounded-xl" />}>
      <LoginForm />
    </Suspense>
  );
}
