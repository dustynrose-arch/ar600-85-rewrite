import { NextResponse, type NextRequest } from "next/server";
import { wgAccessCookieValid, WG_ACCESS_COOKIE } from "@/lib/wg-access";

const PUBLIC_PATHS = new Set(["/access", "/api/access"]);
const PUBLIC_FILES = new Set(["/g1-seal.png", "/army-seal.png", "/favicon.ico"]);

export async function middleware(request: NextRequest) {
  // Static member access so the Edge bundler injects this secret. A helper-only
  // read can leave it undefined on Vercel Edge; GET / then skips the gate,
  // loads the store, and Production shows Application error.
  const secret = process.env.WG_ACCESS_SECRET?.trim();
  if (!secret) return NextResponse.next();
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/_next/") || pathname.startsWith("/spellcheck/") || PUBLIC_FILES.has(pathname)) {
    return NextResponse.next();
  }
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();
  const cookie = request.cookies.get(WG_ACCESS_COOKIE)?.value;
  if (await wgAccessCookieValid(cookie, secret)) return NextResponse.next();
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Working-group access required." }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/access";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
