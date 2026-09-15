import { sessionCookieOptions } from "./cookie-options.ts";
import { runtimeEnv } from "./runtime-env.ts";

/** HttpOnly session set after the WG shared secret is accepted. */
export const WG_ACCESS_COOKIE = "ar60085-wg";
const WG_ACCESS_MAX_AGE = 60 * 60 * 24 * 365;

const WG_ACCESS_PAYLOAD = "ar60085-wg-v1";

export function wgAccessSecret(): string {
  return runtimeEnv("WG_ACCESS_SECRET");
}

export function wgAccessConfigured(): boolean {
  return wgAccessSecret().length > 0;
}

export function wgAccessCookieOptions(request?: Request): {
  path: string;
  sameSite: "lax";
  secure: boolean;
  httpOnly: boolean;
  maxAge: number;
} {
  return {
    ...sessionCookieOptions(request),
    httpOnly: true,
    maxAge: WG_ACCESS_MAX_AGE,
  };
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
