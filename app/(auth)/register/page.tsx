import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthTabs }  from "@/components/auth/auth-tabs";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <AuthShell>
      <AuthTabs defaultTab="register" />
    </AuthShell>
  );
}
