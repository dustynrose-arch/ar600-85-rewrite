import { NextResponse } from "next/server";
import { flattenSections, sectionMap } from "@/lib/baseline";
import { readState } from "@/lib/store";
import { buildSummaryOfChange } from "@/lib/summary-of-change";

export const runtime = "nodejs";

export function GET() {
  const state = readState();
  const summary = buildSummaryOfChange(sectionMap(), state.workingSections, flattenSections());
  return NextResponse.json(summary);
}
