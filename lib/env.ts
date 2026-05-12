/**
 * Server-side environment validation.
 * Import this at the top of any server module that needs env vars.
 * Fails fast with clear errors rather than cryptic runtime failures.
 *
 * NEVER import this file in client components.
 */
import { z } from "zod";

const envSchema = z.object({
  // Database — required for all server operations
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required (Supabase transaction pooler URL)"),
  DIRECT_URL:   z.string().min(1, "DIRECT_URL is required (Supabase direct/session connection URL)"),

  // Supabase — required for auth
  NEXT_PUBLIC_SUPABASE_URL:      z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY:     z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

  // AI — optional: semantic search + embeddings degrade gracefully without it
  OPENAI_API_KEY: z.string().optional(),

  // Cron / job secrets — optional: jobs return 401 if unset
  CRON_SECRET:      z.string().optional(),
  EMBED_JOB_SECRET: z.string().optional(),

  // Dev auth bypass — only honoured when NODE_ENV=development; production ignores this entirely
  DEV_AUTH_BYPASS: z.string().optional(),

  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const lines = result.error.issues.map(
      (issue) => `  • ${issue.path.join(".")}: ${issue.message}`
    );
    console.error(
      `\n[env] ❌ Environment validation failed:\n${lines.join("\n")}\n\n` +
        "  Copy .env.example to .env.local and fill in all required values.\n"
    );
    throw new Error(`Environment validation failed — check server logs for details.`);
  }
  return result.data;
}

export const env = parseEnv();
