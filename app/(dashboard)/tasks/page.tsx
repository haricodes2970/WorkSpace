import type { Metadata } from "next";
import { requireAuthUser } from "@/services/auth.service";
import { Zap } from "lucide-react";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage() {
  await requireAuthUser();

  return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-center">
      <Zap className="h-10 w-10 text-[--color-text-muted] opacity-25 mb-4" />
      <p className="text-[14px] text-[--color-text-muted]">Tasks workspace</p>
      <p className="text-[12px] text-[--color-text-muted] mt-1">Coming in Phase 2.</p>
    </div>
  );
}
