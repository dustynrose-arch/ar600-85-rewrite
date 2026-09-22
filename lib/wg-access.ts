import { sessionCookieOptions } from "./cookie-options.ts";
import { runtimeEnv } from "./runtime-env.ts";

/** HttpOnly cookie set after the WG shared secret is accepted. */
export const WG_ACCESS_COOKIE = "ar60085-wg";

const WG_ACCESS_PAYLOAD = "ar60085-wg-v1";

/**
 * Browser session cookie. Omit Max-Age and Expires so quitting the browser
 * drops WG access. Do not set an 8–12 hour or 1-year Max-Age.
 */
export function wgAccessCookieOptions(request?: Request): {
  path: string;
  sameSite: "lax";
  secure: boolean;
  httpOnly: true;
} {
  return {
    ...sessionCookieOptions(request),
    httpOnly: true,
  };
}

/** Clear ar60085-wg with the same Path / Secure / SameSite / HttpOnly flags. */
export function wgAccessClearCookieOptions(request?: Request): {
  path: string;
  sameSite: "lax";
  secure: boolean;
  httpOnly: true;
  maxAge: 0;
  expires: Date;
} {
  return {
    ...wgAccessCookieOptions(request),
    maxAge: 0,
    expires: new Date(0),
  };
}

export function wgAccessSecret(): string {
  return runtimeEnv("WG_ACCESS_SECRET");
}

export function wgAccessConfigured(): boolean {
  return wgAccessSecret().length > 0;
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function wgAccessCookieValue(secret = wgAccessSecret()): Promise<string> {
  const hex = await hmacHex(secret, WG_ACCESS_PAYLOAD);
  return `v1.${hex}`;
}

export async function wgAccessCookieValid(
  value: string | null | undefined,
  secret = wgAccessSecret(),
): Promise<boolean> {
  if (!secret) return true;
  if (!value) return false;
  const expected = await wgAccessCookieValue(secret);
  return bytesEqual(new TextEncoder().encode(value), new TextEncoder().encode(expected));
}

export function secretsMatch(provided: string, expected: string): boolean {
  return bytesEqual(new TextEncoder().encode(provided), new TextEncoder().encode(expected));
}
