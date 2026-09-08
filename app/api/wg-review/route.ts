import { NextResponse } from "next/server";
import { markWgReview, publicState } from "@/lib/store";
import type { Role } from "@/lib/types";
import { modeFromRequest } from "@/lib/workspace-mode";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const mode = modeFromRequest(request);
  try {
    const body = (await request.json()) as { sectionId: string | "all" | "clear"; role: Role };
    markWgReview(body.sectionId, body.role, mode);
    return NextResponse.json(publicState(mode));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "WG mark failed" }, { status: 400 });
  }
}
