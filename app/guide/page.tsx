import Link from "next/link";
import { cookies } from "next/headers";
import { DraftBanner } from "@/components/DraftBanner";
import { HEADER_TITLE, HeaderBrand } from "@/components/HeaderBrand";
import { TrainingBanner } from "@/components/TrainingBanner";
import { TrainingSwitch } from "@/components/TrainingSwitch";
import { UserGuide } from "@/components/UserGuide";
import { publicState } from "@/lib/store";
import { parseWorkspaceMode, WORKSPACE_MODE_COOKIE } from "@/lib/workspace-mode";

export const dynamic = "force-dynamic";

export default async function GuidePage() {
  const cookieStore = await cookies();
  const mode = parseWorkspaceMode(cookieStore.get(WORKSPACE_MODE_COOKIE)?.value);
  const state = publicState(mode);
  return (
    <main className="min-h-screen bg-army-cream">
      <header className="shrink-0 bg-army-black text-army-cream px-4 py-2 flex items-center gap-4">
        <HeaderBrand title={`${HEADER_TITLE} — User Guide`} detail="How to use your draft" />
        <div className="flex items-center gap-2">
          <TrainingSwitch mode={mode} role={state.role} />
          <Link href="/" className="btn-header-ghost">
            Return to your draft
          </Link>
        </div>
      </header>
      <DraftBanner />
      {mode === "training" ? <TrainingBanner /> : null}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <UserGuide />
      </div>
    </main>
  );
}
