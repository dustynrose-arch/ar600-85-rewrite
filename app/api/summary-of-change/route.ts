import { NextResponse } from "next/server";
import { baselineDocument, sectionMap } from "@/lib/baseline";
import { parentIndexFromDocument } from "@/lib/outline";
import { readState } from "@/lib/store";
import { buildSummaryFromWorkspace } from "@/lib/summary-of-change";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(
    buildSummaryFromWorkspace(readState(), sectionMap(), parentIndexFromDocument(baselineDocument)),
  );
}
