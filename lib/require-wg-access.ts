import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WG_ACCESS_COOKIE, wgAccessConfigured, wgAccessCookieValid } from "./wg-access.ts";

/** Server-component gate. Runs even if Edge middleware missed WG_ACCESS_SECRET. */
export async function requireWgAccess(from = "/"): Promise<void> {
  if (!wgAccessConfigured()) return;
  const jar = await cookies();
  if (await wgAccessCookieValid(jar.get(WG_ACCESS_COOKIE)?.value)) return;
  const target = from.startsWith("/") ? from : "/";
  redirect(`/access?from=${encodeURIComponent(target)}`);
}
