import { sessionCookieOptions } from "./cookie-options.ts";
import type { WorkspaceMode } from "./types.ts";

export type { WorkspaceMode };

/** Cookie that remembers Training vs live across refresh. */
export const WORKSPACE_MODE_COOKIE = "ar60085-workspace";

export const WORKSPACE_MODE_MAX_AGE = 60 * 60 * 24 * 365;

export function isWorkspaceMode(value: unknown): value is WorkspaceMode {
  return value === "live" || value === "training";
}

export function parseWorkspaceMode(value: string | null | undefined): WorkspaceMode {
  return value === "training" ? "training" : "live";
}

export function modeFromCookieHeader(header: string | null | undefined): WorkspaceMode {
  if (!header) return "live";
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const name = trimmed.slice(0, eq).trim();
    if (name !== WORKSPACE_MODE_COOKIE) continue;
    return parseWorkspaceMode(decodeURIComponent(trimmed.slice(eq + 1).trim()));
  }
  return "live";
}

export function modeFromRequest(request: Request): WorkspaceMode {
  return modeFromCookieHeader(request.headers.get("cookie"));
}

export function workspaceModeCookie(
  mode: WorkspaceMode,
  request?: Request,
): {
  name: string;
  value: WorkspaceMode;
  options: { path: string; sameSite: "lax"; maxAge: number; httpOnly: boolean; secure: boolean };
} {
  return {
    name: WORKSPACE_MODE_COOKIE,
    value: mode,
    options: {
      ...sessionCookieOptions(request),
      maxAge: WORKSPACE_MODE_MAX_AGE,
      httpOnly: false,
    },
  };
}
