import { NextResponse } from "next/server";
import { statusForError } from "@/lib/roles";
import {
  publicState,
  resetTrainingWorkspace,
  setRole,
  touchActivity,
} from "@/lib/store";
import type { Role } from "@/lib/types";
import {
  isWorkspaceMode,
  modeFromRequest,
  workspaceModeCookie,
  type WorkspaceMode,
} from "@/lib/workspace-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonState(mode: WorkspaceMode) {
  return NextResponse.json(publicState(mode));
}

export function GET(request: Request) {
  return jsonState(modeFromRequest(request));
}

export async function POST(request: Request) {
  const currentMode = modeFromRequest(request);
  const body = (await request.json()) as {
    action?: string;
    role?: Role;
    mode?: WorkspaceMode;
  };
  if (body.action === "mode" && isWorkspaceMode(body.mode)) {
    const response = jsonState(body.mode);
    const cookie = workspaceModeCookie(body.mode);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  }
  if (body.action === "reset-training") {
    if (currentMode !== "training") {
      return NextResponse.json({ error: "Reset is only available in Training." }, { status: 400 });
    }
    try {
      const role = body.role ?? publicState(currentMode).role;
      resetTrainingWorkspace(role);
      return jsonState("training");
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Reset failed" },
        { status: statusForError(error) },
      );
    }
  }
  if (body.action === "role" && body.role) {
    setRole(body.role, currentMode);
  } else if (body.action === "touch") {
    touchActivity(currentMode);
  }
  return jsonState(currentMode);
}
