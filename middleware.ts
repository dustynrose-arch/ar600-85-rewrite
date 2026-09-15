import { NextResponse, type NextRequest } from "next/server";
import { runtimeEnv } from "@/lib/runtime-env";
import { wgAccessCookieValid, WG_ACCESS_COOKIE } from "@/lib/wg-access";

const PUBLIC_PATHS = new Set(["/access", "/api/access"]);
const PUBLIC_FILES = new Set(["/g1-seal.png", "/army-seal.png", "/favicon.ico"]);

function middlewareSecret(): string {
  // Static member access keeps these keys in the Edge isolate allowlist.
  const listed = process.env.WG_ACCESS_SECRET?.trim() ?? "";
  void process.env.BLOB_READ_WRITE_TOKEN;
  void process.env.BLOB_STORE_ID;
  void process.env.VERCEL_OIDC_TOKEN;
  return listed || runtimeEnv("WG_ACCESS_SECRET");
}

function redirectToAccess(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/access";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  try {
    const secret = middlewareSecret();
    if (!secret) return NextResponse.next();
    if (pathname.startsWith("/_next/") || pathname.startsWith("/spellcheck/") || PUBLIC_FILES.has(pathname)) {
      return NextResponse.next();
    }
    if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();
    const cookie = request.cookies.get(WG_ACCESS_COOKIE)?.value;
    if (await wgAccessCookieValid(cookie, secret)) return NextResponse.next();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Working-group access required." }, { status: 401 });
    }
    return redirectToAccess(request, pathname);
  } catch {
    // Never 500 the document. /access must stay reachable if the gate throws.
    if (pathname === "/access" || pathname.startsWith("/api/access") || pathname.startsWith("/_next/")) {
      return NextResponse.next();
    }
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Working-group access required." }, { status: 401 });
    }
    return redirectToAccess(request, pathname);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
