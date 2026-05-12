import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { requireAuthUser } from "@/services/auth.service";
import { getTodayData } from "@/features/today/today.service";
import { TodayPage } from "@/features/today/today-page";
import { dismissInsightAction } from "@/features/intelligence/actions/intelligence-actions";

export const metadata: Metadata = { title: "Today" };

export default async function TodayRoute() {
  const user = await requireAuthUser();
  const data = await getTodayData(user.profile.id);

  async function handleDismissInsight(id: string) {
    "use server";
    await dismissInsightAction(id);
    revalidatePath("/today");
  }

  return (
    <TodayPage
      data={data}
      userName={user.profile.name}
      onDismissInsight={handleDismissInsight}
    />
  );
}
