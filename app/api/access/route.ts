import { NextResponse } from "next/server";
import {
  secretsMatch,
  wgAccessConfigured,
  wgAccessCookieOptions,
  wgAccessCookieValid,
  wgAccessCookieValue,
  wgAccessSecret,
  WG_ACCESS_COOKIE,
} from "@/lib/wg-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const configured = wgAccessConfigured();
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${WG_ACCESS_COOKIE}=`));
  const value = match ? decodeURIComponent(match.slice(WG_ACCESS_COOKIE.length + 1)) : undefined;
  return NextResponse.json({
    configured,
    unlocked: configured ? await wgAccessCookieValid(value) : true,
  });
}

export async function POST(request: Request) {
  if (!wgAccessConfigured()) {
    return NextResponse.json({ error: "WG access secret is not configured." }, { status: 400 });
  }
  const body = (await request.json().catch(() => ({}))) as { secret?: string };
  const provided = body.secret?.trim() ?? "";
  if (!provided || !secretsMatch(provided, wgAccessSecret())) {
    return NextResponse.json({ error: "That working-group password is not correct." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(WG_ACCESS_COOKIE, await wgAccessCookieValue(), wgAccessCookieOptions(request));
  return response;
}
