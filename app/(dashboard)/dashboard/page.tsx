import type { Metadata } from "next";
import { requireAuthUser } from "@/services/auth.service";
import { DashboardUI } from "@/features/dashboard/components/dashboard-ui";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { profile } = await requireAuthUser();

  // Phase 1: empty state data — real queries added in Phase 2
  const stats = {
    activeProjects: 0,
    openIdeas: 0,
    tasksDueToday: 0,
    shipped: 0,
  };

  return (
    <DashboardUI
      userName={profile.name}
      stats={stats}
      recentActivity={[]}
    />
  );
}
