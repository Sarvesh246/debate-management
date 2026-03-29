import { z } from "zod";
export {
  canUseLocalWorkspaceMode,
  DEPLOYED_SUPABASE_CONFIG_ERROR,
} from "./runtime-mode";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional(),
);
const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url().optional(),
);

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  DATABASE_URL: optionalString,
  GEMINI_API_KEY: optionalString,
  TAVILY_API_KEY: optionalString,
  SEMANTIC_SCHOLAR_API_KEY: optionalString,
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = envSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    SEMANTIC_SCHOLAR_API_KEY: process.env.SEMANTIC_SCHOLAR_API_KEY,
  });

  return cachedEnv;
}

export function clearEnvCache() {
  cachedEnv = null;
}

export function getSupabaseEnvPresence() {
  const env = getEnv();
  return {
    supabaseUrl: Boolean(env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    databaseUrl: Boolean(env.DATABASE_URL),
  };
}

export function getMissingSupabaseServerEnvNames() {
  const presence = getSupabaseEnvPresence();
  return [
    !presence.supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !presence.supabaseAnonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
    !presence.databaseUrl ? "DATABASE_URL" : null,
  ].filter(Boolean) as string[];
}

export function getMissingSupabaseBrowserEnvNames() {
  const presence = getSupabaseEnvPresence();
  return [
    !presence.supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !presence.supabaseAnonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
  ].filter(Boolean) as string[];
}

export function isSupabaseConfigured() {
  return getMissingSupabaseServerEnvNames().length === 0;
}

export function isSupabaseBrowserConfigured() {
  return getMissingSupabaseBrowserEnvNames().length === 0;
}

export function getSupabaseServerConfigError() {
  const missing = getMissingSupabaseServerEnvNames();
  if (missing.length === 0) {
    return undefined;
  }

  return `Supabase is required in deployed environments. Missing: ${missing.join(", ")}.`;
}

export function isGeminiConfigured() {
  return Boolean(getEnv().GEMINI_API_KEY);
}

export function isTavilyConfigured() {
  return Boolean(getEnv().TAVILY_API_KEY);
}
