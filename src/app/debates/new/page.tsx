import Link from "next/link";
import { DebateSetupWizard } from "@/components/debate/setup-wizard";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getHeaderViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export default async function NewDebatePage() {
  const viewer = await getHeaderViewer();
  const requiresAuthToCreate = viewer === null && isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.22em] text-primary">New debate</p>
            <h1 className="font-heading text-4xl tracking-tight">Start fast. Let the system build the rest in stages.</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Enter the resolution and sides first. Debate Command will build the round brief, retrieve and score
              evidence, assemble arguments, stress-test rebuttals, and prepare the live packet in a cleaner
              command-center flow. If provider-backed synthesis is unavailable, the deterministic engine takes over
              automatically.
            </p>
          </div>
          <div className="rounded-3xl border border-border/70 bg-card/70 p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-primary">After you submit</div>
            <div className="mt-3 space-y-3 text-sm text-muted-foreground">
              <p>1. We clarify the round and rank the decision criteria.</p>
              <p>2. We retrieve sources and show the trust picture.</p>
              <p>3. We build your case, rebuttals, and live packet in order.</p>
            </div>
          </div>
        </div>
        {requiresAuthToCreate ? (
          <Card className="border-border/70 bg-card/75">
            <CardHeader className="space-y-3">
              <div className="text-sm uppercase tracking-[0.22em] text-primary">Sign in required</div>
              <CardTitle className="font-heading text-3xl tracking-tight">
                Log in before you build a saved debate workspace.
              </CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-6">
                The public marketing pages are open, but creating and saving a debate workspace uses your authenticated account. Log in or create an account, then come back here to start the build flow.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/signup">Create account</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DebateSetupWizard />
        )}
      </main>
    </div>
  );
}
