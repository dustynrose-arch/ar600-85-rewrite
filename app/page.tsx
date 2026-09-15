import { cookies } from "next/headers";
import { StoreError } from "@/components/StoreError";
import { Workbench } from "@/components/Workbench";
import { baselineDocument } from "@/lib/baseline";
import { requireWgAccess } from "@/lib/require-wg-access";
import { loadPublicStateOrError } from "@/lib/safe-public-state";
import { parseWorkspaceMode, WORKSPACE_MODE_COOKIE } from "@/lib/workspace-mode";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await requireWgAccess("/");
  const cookieStore = await cookies();
  const mode = parseWorkspaceMode(cookieStore.get(WORKSPACE_MODE_COOKIE)?.value);
  const loaded = await loadPublicStateOrError(mode);
  if (!loaded.ok) {
    return <StoreError training={mode === "training"} message={loaded.message} />;
  }
  return <Workbench baseline={baselineDocument} initialState={loaded.state} />;
}
