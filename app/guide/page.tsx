import Link from "next/link";
import { cookies } from "next/headers";
import { HEADER_TITLE, HeaderBrand } from "@/components/HeaderBrand";
import { StoreError } from "@/components/StoreError";
import { TrainingBanner } from "@/components/TrainingBanner";
import { TrainingSwitch } from "@/components/TrainingSwitch";
import { UserGuide } from "@/components/UserGuide";
import { PersistError } from "@/lib/persist";
import { requireWgAccess } from "@/lib/require-wg-access";
import { publicState } from "@/lib/store";
import { parseWorkspaceMode, WORKSPACE_MODE_COOKIE } from "@/lib/workspace-mode";

export const dynamic = "force-dynamic";

export default async function GuidePage() {
  await requireWgAccess("/guide");
  const cookieStore = await cookies();
  const mode = parseWorkspaceMode(cookieStore.get(WORKSPACE_MODE_COOKIE)?.value);
  let state;
  try {
    state = await publicState(mode);
  } catch (error) {
    if (error instanceof PersistError) {
      return <StoreError training={mode === "training"} message={error.message} />;
    }
    throw error;
  }
  return (
    <main className="min-h-screen bg-army-black text-army-cream">
      <header className="header-bar">
        <HeaderBrand
          title={`${HEADER_TITLE} — User Guide`}
          detail="How to use your draft"
          training={mode === "training"}
        />
        <div className="header-actions">
          <TrainingSwitch mode={mode} role={state.role} />
          <Link href="/" className="btn-header">
            Return to your draft
          </Link>
        </div>
      </header>
      {mode === "training" ? <TrainingBanner /> : null}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <UserGuide />
      </div>
    </main>
  );
}
