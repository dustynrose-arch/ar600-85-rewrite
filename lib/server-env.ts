import { nodeIsolateEnv } from "./node-env.ts";
import { firstNonEmpty, runtimeEnv } from "./runtime-env.ts";

/**
 * Node API routes, RSC, and Blob helpers. Combines the Edge-safe runtimeEnv
 * map with the unbundled `node:process` isolate. Never import from middleware.
 */
export function serverEnv(name: string): string {
  return firstNonEmpty(runtimeEnv(name), nodeIsolateEnv(name));
}
