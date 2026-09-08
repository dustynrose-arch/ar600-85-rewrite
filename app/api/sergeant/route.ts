import { NextResponse } from "next/server";
import { runSergeant } from "@/lib/sergeant";
import { publicState, readState, setSergeantDecision } from "@/lib/store";
import type { Role, SergeantDecision } from "@/lib/types";
import { modeFromRequest } from "@/lib/workspace-mode";

export const runtime = "nodejs";

export function GET(request: Request) {
  const mode = modeFromRequest(request);
  const state = readState(mode);
  return NextResponse.json({ findings: runSergeant(state.workingSections, state.sergeant) });
}

export async function POST(request: Request) {
  const mode = modeFromRequest(request);
  try {
    const body = (await request.json()) as {
      laneId: string;
      decision: SergeantDecision;
      citeTo?: string;
      role: Role;
    };
    setSergeantDecision(body.laneId, body.decision, body.citeTo, body.role, mode);
    const state = readState(mode);
    return NextResponse.json({
      ...publicState(mode),
      findings: runSergeant(state.workingSections, state.sergeant),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Overlap check failed" }, { status: 400 });
  }
}
