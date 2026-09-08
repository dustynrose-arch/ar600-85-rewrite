import { NextResponse } from "next/server";
import { runSergeant } from "@/lib/sergeant";
import { publicState, readState, setSergeantDecision } from "@/lib/store";
import type { Role, SergeantDecision } from "@/lib/types";

export const runtime = "nodejs";

export function GET() {
  const state = readState();
  return NextResponse.json({ findings: runSergeant(state.workingSections, state.sergeant) });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      laneId: string;
      decision: SergeantDecision;
      citeTo?: string;
      role: Role;
    };
    setSergeantDecision(body.laneId, body.decision, body.citeTo, body.role);
    const state = readState();
    return NextResponse.json({
      ...publicState(),
      findings: runSergeant(state.workingSections, state.sergeant),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Overlap check failed" }, { status: 400 });
  }
}
