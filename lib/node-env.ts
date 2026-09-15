import nodeProcess from "node:process";

/**
 * Node serverless / RSC only. `node:process` stays a webpack external, so
 * `env[name]` is the isolate's real process.env — not a build-time snapshot
 * of `process.env.NAME`. Do not import this from middleware.ts (Edge).
 */
export function nodeIsolateEnv(name: string): string {
  const value = nodeProcess.env[name];
  return typeof value === "string" ? value.trim() : "";
}
