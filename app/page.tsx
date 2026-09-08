import { cookies } from "next/headers";
import { Workbench } from "@/components/Workbench";
import { baselineDocument } from "@/lib/baseline";
import { publicState } from "@/lib/store";
import { parseWorkspaceMode, WORKSPACE_MODE_COOKIE } from "@/lib/workspace-mode";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = await cookies();
  const mode = parseWorkspaceMode(cookieStore.get(WORKSPACE_MODE_COOKIE)?.value);
  const state = publicState(mode);
  return <Workbench baseline={baselineDocument} initialState={state} />;
}
