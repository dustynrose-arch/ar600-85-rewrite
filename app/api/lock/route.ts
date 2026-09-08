import { NextResponse } from "next/server";
import { lockWorkspace, publicState, unlockWorkspace } from "@/lib/store";
import type { Role } from "@/lib/types";
import { modeFromRequest } from "@/lib/workspace-mode";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const mode = modeFromRequest(request);
  try {
    const body = (await request.json()) as { action: "lock" | "unlock"; reason?: string; role: Role };
    if (body.action === "lock") {
      lockWorkspace(body.reason ?? "Manual lock", body.role, mode);
    } else {
      unlockWorkspace(body.role, mode);
    }
    return NextResponse.json(publicState(mode));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Lock failed" }, { status: 400 });
  }
}
