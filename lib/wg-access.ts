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

const ACCESS_ERROR_DENIED = "That working-group password is not correct.";
const ACCESS_ERROR_UNCONFIGURED = "WG access secret is not configured.";

export type AccessSubmission = {
  secret: string;
  from: string;
  form: boolean;
};

export type AccessPostDecision =
  | { kind: "json"; status: 200 }
  | { kind: "json"; status: 400 | 401; error: string }
  | { kind: "redirect"; path: string; setCookie: boolean };

/**
 * Same-origin path only. Rejects protocol-relative and backslash tricks that
 * browsers treat as a different host.
 */
export function safeAccessNext(from: string | null | undefined): string {
  const value = (from ?? "").trim();
  if (!value || value.length > 2048) return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  if (value.includes("\\") || value.includes("://")) return "/";
  if (/[\u0000-\u001F\u007F]/.test(value)) return "/";
  try {
    const url = new URL(value, "https://wg.invalid");
    if (url.origin !== "https://wg.invalid") return "/";
    if (url.username || url.password) return "/";
    return `${url.pathname}${url.search}`;
  } catch {
    return "/";
  }
}

export function accessErrorMessage(code: string | null | undefined): string | null {
  if (code === "denied") return ACCESS_ERROR_DENIED;
  if (code === "unconfigured") return ACCESS_ERROR_UNCONFIGURED;
  return null;
}

/** Where a no-JS form POST should land. `ok` stays on the requested path. */
export function accessRedirectPath(
  outcome: "ok" | "denied" | "unconfigured",
  from: string | null | undefined,
): string {
  const next = safeAccessNext(from);
  if (outcome === "ok") return next;
  const params = new URLSearchParams();
  params.set("error", outcome);
  if (next !== "/") params.set("from", next);
  return `/access?${params.toString()}`;
}

export function isAccessFormContentType(contentType: string | null | undefined): boolean {
  const type = (contentType ?? "").toLowerCase();
  return type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data");
}

export async function readAccessSubmission(request: Request): Promise<AccessSubmission> {
  const url = new URL(request.url);
  const queryFrom = url.searchParams.get("from");
  if (isAccessFormContentType(request.headers.get("content-type"))) {
    try {
      const form = await request.formData();
      const secret = form.get("secret");
      const fromField = form.get("from");
      const from = typeof fromField === "string" ? fromField : queryFrom;
      return {
        secret: typeof secret === "string" ? secret.trim() : "",
        from: safeAccessNext(from),
        form: true,
      };
    } catch {
      return { secret: "", from: safeAccessNext(queryFrom), form: true };
    }
  }
  const body = (await request.json().catch(() => ({}))) as { secret?: unknown; from?: unknown };
  const from = typeof body.from === "string" ? body.from : queryFrom;
  return {
    secret: typeof body.secret === "string" ? body.secret.trim() : "",
    from: safeAccessNext(from),
    form: false,
  };
}

export function decideAccessPost(submission: AccessSubmission, configuredSecret: string): AccessPostDecision {
  if (!configuredSecret) {
    if (submission.form) {
      return { kind: "redirect", path: accessRedirectPath("unconfigured", submission.from), setCookie: false };
    }
    return { kind: "json", status: 400, error: ACCESS_ERROR_UNCONFIGURED };
  }
  if (!submission.secret || !secretsMatch(submission.secret, configuredSecret)) {
    if (submission.form) {
      return { kind: "redirect", path: accessRedirectPath("denied", submission.from), setCookie: false };
    }
    return { kind: "json", status: 401, error: ACCESS_ERROR_DENIED };
  }
  if (submission.form) return { kind: "redirect", path: accessRedirectPath("ok", submission.from), setCookie: true };
  return { kind: "json", status: 200 };
}
