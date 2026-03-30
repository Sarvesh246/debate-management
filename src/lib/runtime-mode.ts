export const DEPLOYED_SUPABASE_CONFIG_ERROR =
  "Supabase is required in deployed environments. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and DATABASE_URL.";

export function canUseLocalWorkspaceMode() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test" ||
    process.env.ALLOW_LOCAL_WORKSPACE_MODE === "1"
  );
}
