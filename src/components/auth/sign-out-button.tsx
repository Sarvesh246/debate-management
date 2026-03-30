"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, LogOut } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

interface SignOutButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
}

export function SignOutButton({
  className,
  variant = "destructive",
}: SignOutButtonProps) {
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

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={handleSignOut}
      disabled={isPending || isSigningOut}
    >
      {isPending || isSigningOut ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <LogOut className="size-4" />
      )}
      Sign out
    </Button>
  );
}
