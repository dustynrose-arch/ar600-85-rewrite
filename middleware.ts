import { NextResponse, type NextRequest } from "next/server";
import { wgAccessConfigured, wgAccessCookieValid, WG_ACCESS_COOKIE } from "@/lib/wg-access";

const PUBLIC_PATHS = new Set(["/access", "/api/access"]);
const PUBLIC_FILES = new Set(["/g1-seal.png", "/army-seal.png", "/favicon.ico"]);

export async function middleware(request: NextRequest) {
  if (!wgAccessConfigured()) return NextResponse.next();
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/_next/") || pathname.startsWith("/spellcheck/") || PUBLIC_FILES.has(pathname)) {
    return NextResponse.next();
  }
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();
  const cookie = request.cookies.get(WG_ACCESS_COOKIE)?.value;
  if (await wgAccessCookieValid(cookie)) return NextResponse.next();
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
