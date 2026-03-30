import Link from "next/link";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { SiteHeader } from "@/components/layout/site-header";
import { canUseLocalWorkspaceMode } from "@/lib/env";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:grid lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.24em] text-primary">Authentication</p>
          <h1 className="font-heading text-5xl tracking-tight">Welcome back to Cogent.</h1>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground">
            {canUseLocalWorkspaceMode()
              ? "Log in to access saved debates, evidence libraries, practice sessions, and export history. If Supabase is not configured, the app still runs in local workspace mode."
              : "Log in to access saved debates, evidence libraries, practice sessions, and export history. This deployment requires Supabase Auth and Postgres to be configured."}
          </p>
          <div className="text-sm text-muted-foreground">
            Need an account?{" "}
            <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
              Create one
            </Link>
          </div>
        </div>
        <AuthFormCard mode="login" />
      </main>
    </div>
  );
}
