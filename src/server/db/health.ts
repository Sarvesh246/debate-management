import { sql } from "drizzle-orm";
import type { CapabilityDescriptor } from "@/features/debates/types";
import { canUseLocalWorkspaceMode, getMissingSupabaseServerEnvNames, isSupabaseConfigured } from "@/lib/env";
import { getDb } from "@/server/db";
import { getDatabaseFailureDetail, getDatabaseFailureKind, getDatabaseSetupGuidance } from "@/server/db/errors";
import { debateWorkspaces } from "@/server/db/schema";

function createDescriptor(
  label: string,
  status: CapabilityDescriptor["status"],
  detail: string,
): CapabilityDescriptor {
  return { label, status, detail };
}

export async function getPersistenceCapability(): Promise<CapabilityDescriptor> {
  const missingSupabaseEnvNames = getMissingSupabaseServerEnvNames();

  if (!isSupabaseConfigured()) {
    return canUseLocalWorkspaceMode()
      ? createDescriptor(
          "Persistence",
          "degraded",
          "Database env is missing. Debate data falls back to the local mock store.",
        )
      : createDescriptor(
          "Persistence",
          "unavailable",
          `Supabase Postgres is required in deployed environments. Missing: ${missingSupabaseEnvNames.join(", ")}.`,
        );
  }

  const db = getDb();
  if (!db) {
    return createDescriptor(
      "Persistence",
      "unavailable",
      "Database client could not be initialized from the current environment.",
    );
  }

  try {
    await db.execute(sql`select 1`);
    await db.select({ id: debateWorkspaces.id }).from(debateWorkspaces).limit(1);

    return createDescriptor("Persistence", "ready", "Supabase Postgres query path is healthy.");
  } catch (error) {
    const kind = getDatabaseFailureKind(error);
    const detail = getDatabaseFailureDetail(error);
    return createDescriptor(
      "Persistence",
      "unavailable",
      `${getDatabaseSetupGuidance(kind)} Driver detail: ${detail}.`,
    );
  }
}
