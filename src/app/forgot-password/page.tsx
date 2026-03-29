import Link from "next/link";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { SiteHeader } from "@/components/layout/site-header";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:grid lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.24em] text-primary">Reset access</p>
          <h1 className="font-heading text-5xl tracking-tight">Get back to your saved work.</h1>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground">
            Send a reset email if you need to recover your account. In local mode, just head back to the dashboard.
          </p>
          <div className="text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Return to login
            </Link>
          </div>
        </div>
        <AuthFormCard mode="forgot" />
      </main>
    </div>
  );
}
