import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { FolderClock, Plus, ShieldAlert } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DebateWorkspaceRecord } from "@/features/debates/types";
import { getDatabaseFailureDetail, getDatabaseFailureKind, getDatabaseSetupGuidance } from "@/server/db/errors";
import { getDebateRepository } from "@/server/repositories/debate-repository";
import { requireAppUser } from "@/server/services/debate-access";

export default async function DashboardPage() {
  let debates: DebateWorkspaceRecord[] = [];
  let databaseIssue:
    | {
        kind: ReturnType<typeof getDatabaseFailureKind>;
        detail: string;
      }
    | undefined;

  try {
    const user = await requireAppUser();
    const repository = await getDebateRepository();
    debates = await repository.listDebates(user.id);
  } catch (error) {
    unstable_rethrow(error);
    databaseIssue = {
      kind: getDatabaseFailureKind(error),
      detail: getDatabaseFailureDetail(error),
    };
    console.error("Dashboard database load failed", error);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.22em] text-primary">Dashboard</p>
            <h1 className="font-heading text-4xl tracking-tight">Debate workspaces</h1>
            <p className="text-sm text-muted-foreground">
              Resume saved prep, start new debates, or review recent evidence work.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/debates/new">
              <Plus className="size-4" />
              New debate
            </Link>
          </Button>
        </div>

        {databaseIssue ? (
          <Card className="border-amber-500/25 bg-amber-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-950 dark:text-amber-100">
                <ShieldAlert className="size-5" />
                Database access issue
              </CardTitle>
              <CardDescription className="text-amber-900/80 dark:text-amber-200/90">
                The deployment reached your auth session, but loading saved debates failed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-amber-950 dark:text-amber-100">
              <p>{getDatabaseSetupGuidance(databaseIssue.kind)}</p>
              <div className="rounded-2xl border border-amber-500/20 bg-background/70 p-4 font-mono text-xs leading-6 text-foreground">
                {databaseIssue.detail}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link href={`/settings?setup=database&kind=${databaseIssue.kind}`}>
                    Open settings
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/debates/new">Start a debate anyway</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card className="border-border/70 bg-card/75">
            <CardHeader>
              <CardTitle>Recent debates</CardTitle>
              <CardDescription>
                {debates.length > 0
                  ? "Your latest debate workspaces."
                  : "No debates yet. Create one to start building a full prep packet."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {debates.length > 0 ? (
                debates.map((debate) => (
                  <Link
                    key={debate.id}
                    href={`/debates/${debate.id}/understand`}
                    className="rounded-3xl border border-border/70 bg-background/60 p-5 transition hover:border-primary/30 hover:bg-background"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{debate.title}</div>
                        <div className="text-sm text-muted-foreground">{debate.resolution}</div>
                      </div>
                      <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                        {debate.generationMode}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{debate.format.replaceAll("_", " ")}</span>
                      <span>&bull;</span>
                      <span>{debate.audienceLevel.replaceAll("_", " ")}</span>
                      <span>&bull;</span>
                      <span>{new Date(debate.updatedAt).toLocaleString()}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-border/70 bg-background/50 p-10 text-center">
                  <FolderClock className="mx-auto mb-4 size-10 text-muted-foreground" />
                  <div className="text-lg font-medium">Nothing saved yet</div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your first workspace will appear here after generation completes.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/75">
            <CardHeader>
              <CardTitle>Templates</CardTitle>
              <CardDescription>Fast entry points by category.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              {[
                "Energy",
                "Environment",
                "Public policy",
                "Education",
                "Healthcare",
                "Technology",
                "Business and economics",
                "Ethics and social issues",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                  {item}
                </div>
              ))}
              <div className="rounded-2xl border border-border/70 bg-primary/8 px-4 py-4">
                <div className="mb-1 font-medium text-foreground">Deterministic fallback</div>
                <p className="text-sm">
                  Even without a model key, the app still builds criteria, evidence cards, rebuttals, speeches, and
                  practice prompts.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
