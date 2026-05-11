import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { requireAuthUser } from "@/services/auth.service";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await requireAuthUser();
  } catch {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[--color-background]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar user={user.profile} />
        <main
          className="flex-1 overflow-y-auto p-6"
          id="main-content"
          role="main"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
