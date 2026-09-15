/**
 * Request-time env for Edge middleware and Node bundles.
 *
 * Production evidence (PR #32 still live):
 * - GET /api/access is a Vercel cache MISS returning configured:false — not a
 *   static/CDN leftover.
 * - The same helper already sees VERCEL=1 (home throws VERCEL_REQUIRES_BLOB)
 *   but not WG_ACCESS_SECRET / BLOB_*. So bracket access is not "always empty";
 *   the webpack `process.env` view can keep build-time system keys and omit
 *   runtime-only / Sensitive secrets.
 *
 * Next.js 15 only DefinePlugin-inlines NEXT_PUBLIC_* and its own keys. User
 * secrets stay as `process.env.NAME` — but only if that identifier appears in
 * the bundle. Edge isolates also allowlist static `process.env.NAME`.
 *
 * Read order: static map (embed + Edge), then process.env[name], then
 * globalThis.process.env (isolate, not DefinePlugin). Node API/RSC also call
 * `nodeIsolateEnv` via server-env.ts (node:process, never imported here so
 * Edge middleware cannot pull in the Node builtin).
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

function globalProcessEnv(name: string): string | undefined {
  try {
    return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[
      name
    ];
  } catch {
    return undefined;
  }
}

export function firstNonEmpty(...candidates: Array<string | undefined>): string {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return "";
}

export function runtimeEnv(name: string): string {
  return firstNonEmpty(
    knownRuntimeEnv()[name],
    (process.env as Record<string, string | undefined>)[name],
    globalProcessEnv(name),
  );
}
