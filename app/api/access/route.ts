import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/server-env";
import {
  secretsMatch,
  wgAccessClearCookieOptions,
  wgAccessCookieOptions,
  wgAccessCookieValid,
  wgAccessCookieValue,
  WG_ACCESS_COOKIE,
} from "@/lib/wg-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function accessSecret(): string {
  return serverEnv("WG_ACCESS_SECRET");
}

export async function GET(request: Request) {
  const configured = accessSecret().length > 0;
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${WG_ACCESS_COOKIE}=`));
  const value = match ? decodeURIComponent(match.slice(WG_ACCESS_COOKIE.length + 1)) : undefined;
  return NextResponse.json({
    configured,
    unlocked: configured ? await wgAccessCookieValid(value, accessSecret()) : true,
    keys: {
      WG_ACCESS_SECRET: configured,
      BLOB_READ_WRITE_TOKEN: Boolean(serverEnv("BLOB_READ_WRITE_TOKEN")),
      BLOB_STORE_ID: Boolean(serverEnv("BLOB_STORE_ID")),
      VERCEL_OIDC_TOKEN: Boolean(serverEnv("VERCEL_OIDC_TOKEN")),
      VERCEL: serverEnv("VERCEL") === "1",
    },
  });
}

export async function POST(request: Request) {
  const secret = accessSecret();
  if (!secret) {
    return NextResponse.json({ error: "WG access secret is not configured." }, { status: 400 });
  }
  const body = (await request.json().catch(() => ({}))) as { secret?: string };
  const provided = body.secret?.trim() ?? "";
  if (!provided || !secretsMatch(provided, secret)) {
    return NextResponse.json({ error: "That working-group password is not correct." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(WG_ACCESS_COOKIE, await wgAccessCookieValue(secret), wgAccessCookieOptions(request));
  return response;
}

/** Idempotent. Clears the WG cookie even when it is already gone. */
export async function DELETE(request: Request) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(WG_ACCESS_COOKIE, "", wgAccessClearCookieOptions(request));
  return response;
}
