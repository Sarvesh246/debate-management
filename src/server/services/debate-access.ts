import { redirect } from "next/navigation";
import { getCurrentUserContext } from "@/lib/auth";
import { getDatabaseFailureKind } from "@/server/db/errors";
import { getDebateRepository } from "@/server/repositories/debate-repository";

/** Prefix shared by getSupabaseServerConfigError() ("Missing: …") and DEPLOYED_SUPABASE_CONFIG_ERROR ("Set …"). */
const SUPABASE_DEPLOYMENT_ERROR_PREFIX = "Supabase is required in deployed environments";

export async function requireAppUser() {
  try {
    return await getCurrentUserContext();
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      redirect("/login");
    }
    if (
      error instanceof Error &&
      error.message.startsWith(SUPABASE_DEPLOYMENT_ERROR_PREFIX)
    ) {
      redirect("/settings?setup=supabase");
    }
    throw error;
  }
}

export async function getDebatesForCurrentUser() {
  const user = await requireAppUser();
  try {
    const repository = await getDebateRepository();
    return repository.listDebates(user.id);
  } catch (error) {
    redirect(`/settings?setup=database&kind=${getDatabaseFailureKind(error)}`);
  }
}

export async function getDebateForCurrentUser(debateId: string) {
  const user = await requireAppUser();
  try {
    const repository = await getDebateRepository();
    return repository.getDebate(user.id, debateId);
  } catch (error) {
    redirect(`/settings?setup=database&kind=${getDatabaseFailureKind(error)}`);
  }
}
