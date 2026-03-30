import Link from "next/link";
import { Command, LayoutDashboard, Plus, ShieldCheck } from "lucide-react";
import { getHeaderViewer, type HeaderViewer } from "@/lib/auth";
import { HeaderAccountMenu, HeaderGuestMenu } from "@/components/layout/header-account-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

interface SiteHeaderShellProps {
  viewer: HeaderViewer | null;
}

export async function SiteHeader() {
  const viewer = await getHeaderViewer();
  return <SiteHeaderShell viewer={viewer} />;
}

export function SiteHeaderShell({ viewer }: SiteHeaderShellProps) {
  const hasWorkspaceIdentity = viewer !== null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <Command className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-heading text-lg font-semibold tracking-tight">
              Debate Command
            </div>
            <div className="truncate text-xs text-muted-foreground">
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
          <ThemeToggle />

          {hasWorkspaceIdentity ? (
            <>
              <Button asChild size="sm" className="hidden md:inline-flex">
                <Link href="/debates/new">
                  <Plus className="size-4" />
                  New debate
                </Link>
              </Button>
              <HeaderAccountMenu viewer={viewer} compact={false} />
            </>
          ) : (
            <>
              <div className="hidden items-center gap-2 md:flex">
                <Button asChild variant="outline" size="sm">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">Sign up</Link>
                </Button>
              </div>
              <div className="md:hidden">
                <HeaderGuestMenu />
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
