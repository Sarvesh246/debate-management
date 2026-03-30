import type { Route } from "next";
import Link from "next/link";
import { CircleUserRound, LayoutDashboard, Settings, SquarePen } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SiteHeader } from "@/components/layout/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserInitials } from "@/lib/auth";
import { getAppModeLabel, requireAppUser } from "@/server/services/debate-access";

export default async function ProfilePage() {
  const user = await requireAppUser();
  const initials = getUserInitials(user.name, user.email);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader appModeLabel={getAppModeLabel()} />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.22em] text-primary">Profile</p>
          <h1 className="font-heading text-4xl tracking-tight">Account and workspace identity</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Review the current workspace identity, jump back into debate prep, and manage account access from one place.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="border-border/70 bg-card/75">
            <CardHeader>
              <CardTitle>Current workspace identity</CardTitle>
              <CardDescription>
                {user.mode === "authenticated"
                  ? "Signed in with Supabase Auth."
                  : "Running in local workspace mode without a remote account session."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-start gap-4 rounded-3xl border border-border/70 bg-background/60 p-5">
                <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 font-heading text-lg text-primary">
                  {initials}
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      Display name
                    </div>
                    <div className="text-lg font-medium">{user.name}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      Email
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email ?? "Local workspace does not use a remote email."}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      Mode
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.mode === "authenticated" ? "Authenticated workspace" : "Local workspace"}
                    </div>
                  </div>
                </div>
              </div>

              {user.mode === "local" ? (
                <div className="rounded-3xl border border-amber-500/25 bg-amber-500/10 p-5 text-sm leading-6 text-amber-950 dark:text-amber-100">
                  You are using local workspace mode. Your work stays available locally, but account syncing and sign-out are not relevant until Supabase Auth is configured.
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/75">
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
              <CardDescription>Jump straight to your most common account and prep tasks.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <ActionLink
                href="/dashboard"
                title="Dashboard"
                description="Resume saved workspaces and recent debates."
                icon={<LayoutDashboard className="size-4" />}
              />
              <ActionLink
                href="/settings"
                title="Settings"
                description="Review provider health and workspace defaults."
                icon={<Settings className="size-4" />}
              />
              <ActionLink
                href="/debates/new"
                title="Start a debate"
                description="Open the setup wizard and build a new workspace."
                icon={<SquarePen className="size-4" />}
              />
              {user.mode === "authenticated" ? (
                <SignOutButton className="mt-2 w-full" />
              ) : (
                <ActionLink
                  href="/login"
                  title="Log in"
                  description="Connect a real account to sync workspaces."
                  icon={<CircleUserRound className="size-4" />}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function ActionLink({
  href,
  title,
  description,
  icon,
}: {
  href: Route;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-border/70 bg-background/60 p-4 transition hover:border-primary/30 hover:bg-background"
    >
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <span className="flex size-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        {title}
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
    </Link>
  );
}
