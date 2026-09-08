import { NextResponse } from "next/server";
import { statusForError } from "@/lib/roles";
import {
  addWorkingSection,
  deleteWorkingSection,
  moveWorkingSection,
  publicState,
  renameWorkingSection,
  splitWorkingSection,
} from "@/lib/store";
import type { Role, StructurePosition } from "@/lib/types";
import { modeFromRequest } from "@/lib/workspace-mode";

export const runtime = "nodejs";

type StructureBody = {
  action?: "add" | "delete" | "move" | "rename" | "split";
  role?: Role;
  targetId?: string;
  position?: StructurePosition;
  nodeId?: string;
  parentId?: string;
  index?: number;
  title?: string;
};

export async function POST(request: Request) {
  const mode = modeFromRequest(request);
  try {
    const body = (await request.json()) as StructureBody;
    const role = body.role ?? "reviewer";
    if (body.action === "add") {
      if (!body.targetId || !body.position) throw new Error("Add requires targetId and position.");
      addWorkingSection({ targetId: body.targetId, position: body.position, title: body.title }, role, mode);
    } else if (body.action === "delete") {
      if (!body.nodeId) throw new Error("Delete requires nodeId.");
      deleteWorkingSection(body.nodeId, role, mode);
    } else if (body.action === "move") {
      if (!body.nodeId || !body.parentId || body.index == null) {
        throw new Error("Move requires nodeId, parentId, and index.");
      }
      moveWorkingSection({ sectionId: body.nodeId, parentId: body.parentId, index: body.index }, role, mode);
    } else if (body.action === "rename") {
      if (!body.nodeId || body.title == null) throw new Error("Rename requires nodeId and title.");
      renameWorkingSection(body.nodeId, body.title, role, mode);
    } else if (body.action === "split") {
      if (!body.nodeId) throw new Error("Split requires nodeId.");
      splitWorkingSection(body.nodeId, role, mode);
    } else {
      throw new Error("Unknown structure action.");
    }
    return NextResponse.json(publicState(mode));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Structure edit failed" },
      { status: statusForError(error) },
    );
  }
}
