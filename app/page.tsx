import { Workbench } from "@/components/Workbench";
import { baselineDocument } from "@/lib/baseline";
import { publicState } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const state = publicState();
  return <Workbench baseline={baselineDocument} initialState={state} />;
}
