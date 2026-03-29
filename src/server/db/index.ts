import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv, isSupabaseConfigured } from "@/lib/env";
import * as schema from "@/server/db/schema";

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!dbInstance) {
    const databaseUrl = getEnv().DATABASE_URL!;
    const isLocalHost =
      databaseUrl.includes("127.0.0.1") ||
      databaseUrl.includes("localhost") ||
      databaseUrl.includes("host.docker.internal");

    const connection = postgres(databaseUrl, {
      prepare: false,
      max: 1,
      // Supabase / hosted Postgres require TLS; local dev often does not.
      ...(isLocalHost ? {} : { ssl: "require" as const }),
    });
    dbInstance = drizzle(connection, { schema });
  }

  return dbInstance;
}
