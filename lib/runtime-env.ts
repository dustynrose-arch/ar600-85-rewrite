/**
 * Request-time env for Node serverless, Edge middleware, and Blob helpers.
 *
 * Next.js only embeds keys that appear as static `process.env.NAME` in that
 * bundle. Bracket-only reads (`process.env[name]`) can omit Production secrets
 * from the inlined env object even when Vercel injects them — `/api/access`
 * stays configured:false and GET `/` shows "Draft storage is not ready".
 *
 * The map below lists every key this app reads so webpack/Edge include them.
 * Values are still read inside the function (not at module init) so a cold
 * start sees the isolate env, not a `next build` snapshot.
 */
function knownRuntimeEnv(): Record<string, string | undefined> {
  return {
    WG_ACCESS_SECRET: process.env.WG_ACCESS_SECRET,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    BLOB_STORE_ID: process.env.BLOB_STORE_ID,
    VERCEL_OIDC_TOKEN: process.env.VERCEL_OIDC_TOKEN,
    VERCEL: process.env.VERCEL,
    NEXT_PHASE: process.env.NEXT_PHASE,
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    COOKIE_SECURE: process.env.COOKIE_SECURE,
  };
}

function firstNonEmpty(...candidates: Array<string | undefined>): string {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return "";
}

export function runtimeEnv(name: string): string {
  return firstNonEmpty(
    knownRuntimeEnv()[name],
    (process.env as Record<string, string | undefined>)[name],
  );
}
