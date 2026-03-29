import { cache } from "react";
import {
  canUseLocalWorkspaceMode,
  DEPLOYED_SUPABASE_CONFIG_ERROR,
  getSupabaseServerConfigError,
  isSupabaseConfigured,
} from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface UserContext {
  id: string;
  email?: string;
  name: string;
  mode: "authenticated" | "local";
}

export const getCurrentUserContext = cache(async (): Promise<UserContext> => {
  if (!isSupabaseConfigured()) {
    if (!canUseLocalWorkspaceMode()) {
      throw new Error(getSupabaseServerConfigError() ?? DEPLOYED_SUPABASE_CONFIG_ERROR);
    }

    return {
      id: "local-user",
      email: "local@debate-command.dev",
      name: "Local Workspace",
      mode: "local",
    };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return {
      id: "local-user",
      name: "Local Workspace",
      mode: "local",
    };
  }

  let result: Awaited<ReturnType<typeof supabase.auth.getUser>>;
  try {
    result = await supabase.auth.getUser();
  } catch {
    // Network / transient failures from the Auth API should not crash RSC — treat as signed out.
    throw new Error("AUTH_REQUIRED");
  }
  const { data, error } = result;

  // Never destructure `data: { user }` directly — when `error` is set, `data` can be null and
  // that pattern throws, surfacing as a generic RSC error (common on Vercel when the session is invalid).
  if (error || !data?.user) {
    throw new Error("AUTH_REQUIRED");
  }

  const user = data.user;

  return {
    id: user.id,
    email: user.email,
    name:
      (user.user_metadata?.full_name as string | undefined) ??
      (user.email?.split("@")[0] ?? "Debater"),
    mode: "authenticated",
  };
});

export function isLocalMode() {
  return !isSupabaseConfigured() && canUseLocalWorkspaceMode();
}
