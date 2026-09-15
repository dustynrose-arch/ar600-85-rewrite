/**
 * Request-time env. Next.js inlines `process.env.NAME` at `next build`.
 * If a var was missing (or Sensitive and excluded from the build), the bundle
 * keeps `undefined` even after the var is added — Production then skips the
 * WG gate (`/api/access` → configured:false) and GET `/` 500s in the store.
 * Bracket access reads the serverless/Edge isolate's real runtime env.
 */
export function runtimeEnv(name: string): string {
  const value = (process.env as Record<string, string | undefined>)[name];
  return typeof value === "string" ? value.trim() : "";
}
