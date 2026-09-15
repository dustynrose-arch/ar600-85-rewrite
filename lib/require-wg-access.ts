import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverEnv } from "./server-env.ts";
import { WG_ACCESS_COOKIE, wgAccessCookieValid } from "./wg-access.ts";

/** Server-component gate. Runs even if Edge middleware missed WG_ACCESS_SECRET. */
export async function requireWgAccess(from = "/"): Promise<void> {
  const secret = serverEnv("WG_ACCESS_SECRET");
  if (!secret) return;
  const jar = await cookies();
  if (await wgAccessCookieValid(jar.get(WG_ACCESS_COOKIE)?.value, secret)) return;
  const target = from.startsWith("/") ? from : "/";
  redirect(`/access?from=${encodeURIComponent(target)}`);
}
