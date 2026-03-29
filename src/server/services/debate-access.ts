import { redirect } from "next/navigation";
import { getCurrentUserContext, isLocalMode } from "@/lib/auth";
import {
  canUseLocalWorkspaceMode,
  DEPLOYED_SUPABASE_CONFIG_ERROR,
  isSupabaseConfigured,
} from "@/lib/env";
import { getDebateRepository } from "@/server/repositories/debate-repository";

export async function requireAppUser() {
  try {
    return await getCurrentUserContext();
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      redirect("/login");
    }
    if (
      error instanceof Error &&
      error.message === DEPLOYED_SUPABASE_CONFIG_ERROR
    ) {
      redirect("/settings?setup=supabase");
    }
    throw error;
  }
}

export async function getDebatesForCurrentUser() {
  const user = await requireAppUser();
  const repository = await getDebateRepository();
  return repository.listDebates(user.id);
}

export async function getDebateForCurrentUser(debateId: string) {
  const user = await requireAppUser();
  const repository = await getDebateRepository();
  return repository.getDebate(user.id, debateId);
}

export function getAppModeLabel() {
  if (!isSupabaseConfigured() && !canUseLocalWorkspaceMode()) {
    return "Configuration required";
  }

  return isLocalMode() ? "Local workspace mode" : "Authenticated workspace mode";
}
