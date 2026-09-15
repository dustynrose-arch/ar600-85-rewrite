import { cookies } from "next/headers";
import { HeaderBrand, HEADER_TITLE } from "@/components/HeaderBrand";
import { WgAccessForm } from "@/components/WgAccessForm";
import { parseWorkspaceMode, WORKSPACE_MODE_COOKIE } from "@/lib/workspace-mode";

export const dynamic = "force-dynamic";

export default async function AccessPage() {
  const cookieStore = await cookies();
  const training = parseWorkspaceMode(cookieStore.get(WORKSPACE_MODE_COOKIE)?.value) === "training";
  return (
    <main className="min-h-screen bg-army-black text-army-cream">
      <header className="shrink-0 bg-army-black text-army-cream px-3 py-1 flex items-center gap-3 flex-nowrap overflow-x-auto">
        <HeaderBrand title={`${HEADER_TITLE} — WG access`} training={training} />
      </header>
      <div className="max-w-lg mx-auto px-6 py-10">
        <p className="text-[11px] font-bold tracking-[0.28em] text-army-gold">
          DRAFT TOOL — NOT AN OFFICIAL ARMY SYSTEM
        </p>
        <h1 className="text-2xl font-bold mt-2">Working-group access</h1>
        <p className="mt-3 text-sm text-army-slate leading-relaxed">
          This private URL is for the unclassified G–1 rewrite working group. It is{" "}
          <strong className="text-army-cream">not</strong> an authenticated Army publication or AR 25-30
          system. The G–1 and Army seals always appear with the non-strippable{" "}
          <strong className="text-army-gold">DRAFT</strong> chip — never seals alone.
        </p>
        <WgAccessForm />
      </div>
    </main>
  );
}
