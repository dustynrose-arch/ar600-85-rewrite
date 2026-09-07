import { NextResponse } from "next/server";
import { sectionMap } from "@/lib/baseline";
import { buildDiffs, summarizeDiffs } from "@/lib/diff";
import { readState } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { against?: string };
  const against = body.against ?? "baseline";
  const state = readState();
  const compare =
    against === "baseline"
      ? sectionMap()
      : (state.snapshots.find((snapshot) => snapshot.id === against)?.sections ?? sectionMap());
  const hunks = buildDiffs(state.workingSections, compare);
  return NextResponse.json({
    against,
    changedCount: hunks.filter((hunk) => !hunk.unchanged).length,
    bullets: summarizeDiffs(hunks),
  });
}
