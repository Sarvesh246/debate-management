import Link from "next/link";
import { Command, LayoutDashboard, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

interface SiteHeaderProps {
  appModeLabel?: string;
}

export function SiteHeader({ appModeLabel }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <Command className="size-5" />
          </div>
          <div>
            <div className="font-heading text-lg font-semibold tracking-tight">
              Debate Command
            </div>
            <div className="text-xs text-muted-foreground">
              Debate intelligence platform
            </div>
          </div>
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <LayoutDashboard className="size-4" />
              Dashboard
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/debates/new">Start a debate</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/settings">
              <ShieldCheck className="size-4" />
              Settings
            </Link>
          </Button>
        </nav>
        <div className="flex items-center gap-2">
          {appModeLabel ? (
            <div className="hidden rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground sm:block">
              {appModeLabel}
            </div>
          ) : null}
          <ThemeToggle />
          <Button asChild size="sm">
            <Link href="/debates/new">New debate</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
