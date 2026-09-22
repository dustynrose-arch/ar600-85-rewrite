import { redirect } from "next/navigation";
import { requireWgAccess } from "@/lib/require-wg-access";

export const dynamic = "force-dynamic";

/** Standalone /guide is retired. The workbench User Guide control opens the overlay. */
export default async function GuidePage() {
  await requireWgAccess("/guide");
  redirect("/?guide=1");
}
