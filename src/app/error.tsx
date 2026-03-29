"use client";

import Link from "next/link";
import { ArrowLeft, Home, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-xl rounded-3xl border border-border/70 bg-card/75 p-8 text-center shadow-xl shadow-primary/5">
        <h1 className="font-heading text-3xl tracking-tight">Something broke in the workflow.</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {error.message ||
            "A server-rendered route failed. You can retry, or return to a safe page while configuration is checked."}
        </p>
        {error.digest ? (
          <div className="mt-4 rounded-2xl border border-border/70 bg-background/60 px-4 py-3 font-mono text-xs text-muted-foreground">
            Error digest: {error.digest}
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => reset()}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/settings">
              <Settings className="size-4" />
              Go to settings
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">
              <ArrowLeft className="size-4" />
              Go to login
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">
              <Home className="size-4" />
              Go home
            </Link>
          </Button>
        </div>
        <p className="mt-5 text-xs leading-6 text-muted-foreground">
          If dashboard keeps failing, open Settings and check the deployment setup guidance.
        </p>
      </div>
    </div>
  );
}
