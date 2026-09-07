import { NextResponse } from "next/server";
import { sectionMap } from "@/lib/baseline";
import { buildDiffs } from "@/lib/diff";
import { readState } from "@/lib/store";

export const runtime = "nodejs";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const against = searchParams.get("against") ?? "baseline";
  const changedOnly = searchParams.get("changed") !== "0";
  const state = readState();
  const compare =
    against === "baseline"
      ? sectionMap()
      : (state.snapshots.find((snapshot) => snapshot.id === against)?.sections ?? sectionMap());
  let hunks = buildDiffs(state.workingSections, compare);
  if (changedOnly) hunks = hunks.filter((hunk) => !hunk.unchanged);
  return NextResponse.json({ against, hunks });
}
