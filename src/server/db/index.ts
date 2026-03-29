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
    const connection = postgres(getEnv().DATABASE_URL!, {
      prepare: false,
      max: 1,
    });
    dbInstance = drizzle(connection, { schema });
  }

  return dbInstance;
}
