import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/server-env";
import {
  decideAccessPost,
  readAccessSubmission,
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
  const submission = await readAccessSubmission(request);
  const decision = decideAccessPost(submission, secret);
  if (decision.kind === "redirect") {
    const response = NextResponse.redirect(new URL(decision.path, request.url), 303);
    if (decision.setCookie) {
      response.cookies.set(WG_ACCESS_COOKIE, await wgAccessCookieValue(secret), wgAccessCookieOptions(request));
    }
    return response;
  }
  if (decision.status !== 200) {
    return NextResponse.json({ error: decision.error }, { status: decision.status });
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
