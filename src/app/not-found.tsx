import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-primary">404</p>
        <h1 className="mt-4 font-heading text-5xl tracking-tight">That debate page does not exist.</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
          The workspace may have been deleted, the URL may be incomplete, or the section name may be invalid.
        </p>
        <Button asChild className="mt-8">
          <Link href="/dashboard">Return to dashboard</Link>
        </Button>
      </main>
    </div>
  );
}
