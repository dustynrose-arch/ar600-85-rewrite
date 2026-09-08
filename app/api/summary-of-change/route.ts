import { NextResponse } from "next/server";
import { baselineDocument, sectionMap } from "@/lib/baseline";
import { parentIndexFromDocument } from "@/lib/outline";
import { readState } from "@/lib/store";
import { buildSummaryFromWorkspace } from "@/lib/summary-of-change";
import { modeFromRequest } from "@/lib/workspace-mode";

export const runtime = "nodejs";

export function GET(request: Request) {
  const mode = modeFromRequest(request);
  return NextResponse.json(
    buildSummaryFromWorkspace(readState(mode), sectionMap(), parentIndexFromDocument(baselineDocument)),
  );
}
