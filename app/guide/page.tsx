import Link from "next/link";
import { cookies } from "next/headers";
import { DraftBanner } from "@/components/DraftBanner";
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
        <img
          src="/g1-seal.png"
          alt="Office of the Deputy Chief of Staff, G-1, United States Army seal"
          className="h-12 w-12 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold leading-tight">
            {mode === "training" ? "AR 600-85 Rewrite — TRAINING User Guide" : "AR 600-85 Rewrite — User Guide"}
          </h1>
          <p className="text-xs text-army-gold">
            {mode === "training"
              ? "Practice copy — live workspace is unchanged"
              : "Internal G-1 rewrite working group use only"}
          </p>
          <p className="text-[11px] text-army-cream/80">How to use your draft</p>
        </div>
        <div className="flex items-center gap-2">
          <TrainingSwitch mode={mode} role={state.role} />
          <Link href="/" className="text-sm border border-army-gold/50 px-2 py-1">
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
