import Link from "next/link";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { SiteHeader } from "@/components/layout/site-header";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:grid lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.24em] text-primary">Create account</p>
          <h1 className="font-heading text-5xl tracking-tight">Start storing debates like a serious prep workflow.</h1>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground">
            Sign up to keep your workspaces, exports, and evidence bank synced to a real account. You can still explore the product locally if auth is not configured.
          </p>
          <div className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Log in
            </Link>
          </div>
        </div>
        <AuthFormCard mode="signup" />
      </main>
    </div>
  );
}
