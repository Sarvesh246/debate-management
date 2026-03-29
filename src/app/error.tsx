"use client";

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
      <div className="max-w-lg rounded-3xl border border-border/70 bg-card/75 p-8 text-center">
        <h1 className="font-heading text-3xl tracking-tight">Something broke in the workflow.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{error.message}</p>
        <Button className="mt-6" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </div>
  );
}
