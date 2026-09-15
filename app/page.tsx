import { cookies } from "next/headers";
import { StoreError } from "@/components/StoreError";
import { Workbench } from "@/components/Workbench";
import { baselineDocument } from "@/lib/baseline";
import { PersistError } from "@/lib/persist";
import { requireWgAccess } from "@/lib/require-wg-access";
import { publicState } from "@/lib/store";
import { parseWorkspaceMode, WORKSPACE_MODE_COOKIE } from "@/lib/workspace-mode";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await requireWgAccess("/");
  const cookieStore = await cookies();
  const mode = parseWorkspaceMode(cookieStore.get(WORKSPACE_MODE_COOKIE)?.value);
  try {
    const state = await publicState(mode);
    return <Workbench baseline={baselineDocument} initialState={state} />;
  } catch (error) {
    if (error instanceof PersistError) {
      return <StoreError training={mode === "training"} message={error.message} />;
    }
    throw error;
  }
}
