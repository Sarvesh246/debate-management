"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, MailCheck, Sparkles } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "login" | "signup" | "forgot";

export function AuthFormCard({ mode }: { mode: Mode }) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    setError(null);

    if (!supabase) {
      setMessage("Supabase Auth is not configured in this environment. Use local workspace mode from the dashboard.");
      return;
    }

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      try {
        if (mode === "login") {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInError) throw signInError;
          router.push("/dashboard");
          router.refresh();
          return;
        }

        if (mode === "signup") {
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/dashboard`,
            },
          });
          if (signUpError) throw signUpError;
          setMessage("Check your inbox to confirm your account, then return to the dashboard.");
          return;
        }

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (resetError) throw resetError;
        setMessage("Password reset instructions are on the way.");
      } catch (submissionError) {
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : "Authentication failed.",
        );
      }
    });
  }

  async function sendMagicLink() {
    setMessage(null);
    setError(null);
    const emailInput = document.querySelector<HTMLInputElement>('input[name="email"]');
    if (!supabase || !emailInput?.value) {
      setError("Enter your email first.");
      return;
    }
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: emailInput.value,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setMessage("Magic link sent. Check your email.");
  }

  const title =
    mode === "login" ? "Log in" : mode === "signup" ? "Create your account" : "Reset password";

  return (
    <Card className="border-border/70 bg-card/85 shadow-xl shadow-primary/5">
      <CardHeader className="space-y-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          {mode === "forgot" ? <MailCheck className="size-5" /> : <Sparkles className="size-5" />}
        </div>
        <div>
          <CardTitle className="font-heading text-2xl">{title}</CardTitle>
          <CardDescription>
            Save debates, revisit workspaces, and keep your evidence bank organized.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="coach@debatecommand.ai" required />
          </div>
          {mode !== "forgot" ? (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="Strong password" required />
            </div>
          ) : null}
          {message ? (
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" className="sm:flex-1" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {mode === "login" ? "Log in" : mode === "signup" ? "Create account" : "Send reset link"}
            </Button>
            {mode === "login" ? (
              <Button type="button" variant="outline" className="sm:flex-1" onClick={sendMagicLink}>
                Send magic link
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
