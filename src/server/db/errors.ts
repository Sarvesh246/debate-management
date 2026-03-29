export type DatabaseFailureKind = "schema" | "connection" | "unknown";

function collectErrorTexts(error: unknown, seen = new Set<unknown>()): string[] {
  if (!error || seen.has(error)) {
    return [];
  }
  seen.add(error);

  if (error instanceof Error) {
    return [
      `${error.name}: ${error.message}`,
      ...collectErrorTexts(error.cause, seen),
    ];
  }

  return [String(error)];
}

function getErrorText(error: unknown) {
  return collectErrorTexts(error).join(" | ");
}

export function getDatabaseFailureKind(error: unknown): DatabaseFailureKind {
  const message = getErrorText(error).toLowerCase();

  if (
    (message.includes("relation") && message.includes("does not exist")) ||
    message.includes("column") && message.includes("does not exist") ||
    message.includes("schema") && message.includes("does not exist")
  ) {
    return "schema";
  }

  if (
    message.includes("password authentication failed") ||
    message.includes("connect") ||
    message.includes("connection") ||
    message.includes("econnrefused") ||
    message.includes("enotfound") ||
    message.includes("timeout") ||
    message.includes("certificate") ||
    message.includes("ssl")
  ) {
    return "connection";
  }

  return "unknown";
}

export function getDatabaseFailureDetail(error: unknown) {
  const entries = collectErrorTexts(error)
    .map((entry) => entry.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return entries.at(-1) ?? "Unknown database error";
}

export function getDatabaseSetupGuidance(kind: DatabaseFailureKind) {
  switch (kind) {
    case "schema":
      return "Database schema is not initialized. Run `npm run db:push` against the same DATABASE_URL used by the deployment, then redeploy or refresh.";
    case "connection":
      return "Database connection failed. Verify DATABASE_URL is valid for your Supabase/Postgres instance, that special characters in the password are URL-encoded, and that the deployment can reach the database.";
    default:
      return "Database access failed after environment validation. Check DATABASE_URL and ensure the expected tables exist in the target database.";
  }
}
