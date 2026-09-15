import { NextResponse } from "next/server";
import { createSnapshot, publicState, readState } from "@/lib/store";
import type { Role } from "@/lib/types";
import { modeFromRequest } from "@/lib/workspace-mode";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const mode = modeFromRequest(request);
  const state = await readState(mode);
  return NextResponse.json({
    snapshots: state.snapshots.map(({ sections: _sections, ...rest }) => rest),
  });
}

export async function POST(request: Request) {
  const mode = modeFromRequest(request);
  try {
    const body = (await request.json()) as { label?: string; role: Role };
    await createSnapshot(body.label ?? "", body.role, mode);
    return NextResponse.json(await publicState(mode));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Snapshot failed" }, { status: 400 });
  }
}
