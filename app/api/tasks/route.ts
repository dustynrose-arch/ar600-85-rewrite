import { NextResponse } from "next/server";
import { completeTask, createTask, deleteTask, publicState } from "@/lib/store";
import type { Role } from "@/lib/types";
import { modeFromRequest } from "@/lib/workspace-mode";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const mode = modeFromRequest(request);
  try {
    const body = (await request.json()) as {
      action: "create" | "complete" | "delete";
      title?: string;
      notes?: string;
      sectionId?: string | null;
      taskId?: string;
      role: Role;
    };
    if (body.action === "create") {
      if (!body.title?.trim()) throw new Error("Task title is required.");
      await createTask({ title: body.title.trim(), notes: body.notes, sectionId: body.sectionId }, body.role, mode);
    } else if (body.action === "complete" && body.taskId) {
      await completeTask(body.taskId, body.role, mode);
    } else if (body.action === "delete" && body.taskId) {
      await deleteTask(body.taskId, body.role, mode);
    }
    return NextResponse.json(await publicState(mode));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Task failed" }, { status: 400 });
  }
}
