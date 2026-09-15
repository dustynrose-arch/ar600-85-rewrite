import { runtimeEnv } from "./runtime-env.ts";

/** Shared cookie flags for workspace mode and WG access. */

export function forwardedProto(request?: Request): string | undefined {
  if (!request) return undefined;
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0]!.trim().toLowerCase();
  try {
    return new URL(request.url).protocol.replace(":", "").toLowerCase();
  } catch {
    return undefined;
  }
}

/**
 * Set Secure on HTTPS (Vercel). Leave it off for http://localhost, including
 * `next start` (NODE_ENV=production) so the cookie still sticks.
 * COOKIE_SECURE=1 / 0 overrides detection.
 */
export function cookieSecureFromRequest(request?: Request): boolean {
  const override = runtimeEnv("COOKIE_SECURE").toLowerCase();
  if (override === "1" || override === "true" || override === "yes") return true;
  if (override === "0" || override === "false" || override === "no") return false;
  const proto = forwardedProto(request);
  if (proto === "https") return true;
  if (proto === "http") return false;
  return runtimeEnv("VERCEL") === "1";
}

export function sessionCookieOptions(request?: Request): {
  path: string;
  sameSite: "lax";
  secure: boolean;
} {
  return {
    path: "/",
    sameSite: "lax",
    secure: cookieSecureFromRequest(request),
  };
}
