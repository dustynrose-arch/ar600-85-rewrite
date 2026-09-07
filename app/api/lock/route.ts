import { NextResponse } from "next/server";
import { lockWorkspace, publicState, unlockWorkspace } from "@/lib/store";
import type { Role } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { action: "lock" | "unlock"; reason?: string; role: Role };
    if (body.action === "lock") {
      lockWorkspace(body.reason ?? "Manual lock", body.role);
    } else {
      unlockWorkspace(body.role);
    }
    return NextResponse.json(publicState());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Lock failed" }, { status: 400 });
  }
}
