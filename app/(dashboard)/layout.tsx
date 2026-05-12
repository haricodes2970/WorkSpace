import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AppProviders } from "@/components/layout/app-providers";
import { requireAuthUser } from "@/services/auth.service";
import { signOutAction } from "@/features/auth/actions";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { isDevAuthEnabled } from "@/lib/auth/dev-session";

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

  // Server action injected here — UI component stays pure
  const signOutSlot = (
    <form action={signOutAction}>
      <SignOutButton />
    </form>
  );

  return (
    <AppProviders>
      <div className="flex h-screen overflow-hidden bg-[--color-bg]">
        <Sidebar signOutSlot={signOutSlot} showDevBadge={isDevAuthEnabled()} />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Topbar user={user.profile} />
          <main
            className="flex-1 overflow-y-auto"
            id="main-content"
            role="main"
          >
            {children}
          </main>
        </div>
      </div>
    </AppProviders>
  );
}
