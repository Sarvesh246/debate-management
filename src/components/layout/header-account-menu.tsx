"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CircleUserRound, Loader2, LogIn, LogOut, Settings, SquarePen, LayoutDashboard } from "lucide-react";
import type { HeaderViewer } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderAccountMenuProps {
  viewer: HeaderViewer;
  compact?: boolean;
}

export function HeaderAccountMenu({
  viewer,
  compact = false,
}: HeaderAccountMenuProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSigningOut, setIsSigningOut] = useState(false);

  function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    setIsSigningOut(true);

    startTransition(async () => {
      try {
        await supabase?.auth.signOut({ scope: "local" });
      } finally {
        router.replace("/login");
        router.refresh();
        setIsSigningOut(false);
      }
    });
  }

  const label =
    viewer.mode === "authenticated" ? "Open account menu" : "Open workspace menu";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={compact ? "icon-sm" : "icon"}
          aria-label={label}
        >
          <Avatar size={compact ? "sm" : "default"}>
            <AvatarFallback>{viewer.initials}</AvatarFallback>
          </Avatar>
          <span className="sr-only">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 min-w-64">
        <DropdownMenuLabel>
          <div className="space-y-1 px-1 py-1">
            <div className="font-medium text-foreground">{viewer.name}</div>
            <div className="text-xs font-normal text-muted-foreground">
              {viewer.email ?? "Local workspace mode"}
            </div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              {viewer.workspaceModeLabel}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <CircleUserRound className="size-4" />
            View profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard className="size-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="md:hidden">
          <Link href="/debates/new">
            <SquarePen className="size-4" />
            Start a debate
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {viewer.mode === "authenticated" ? (
          <DropdownMenuItem
            variant="destructive"
            onSelect={(event) => {
              event.preventDefault();
              handleSignOut();
            }}
            disabled={isPending || isSigningOut}
          >
            {isPending || isSigningOut ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            Sign out
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href="/login">
              <LogIn className="size-4" />
              Log in
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function HeaderGuestMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="icon-sm" aria-label="Open account options">
          <CircleUserRound className="size-4" />
          <span className="sr-only">Open account options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 min-w-52">
        <DropdownMenuLabel>Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/login">
            <LogIn className="size-4" />
            Log in
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/signup">
            <SquarePen className="size-4" />
            Sign up
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
