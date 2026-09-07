import { NextResponse } from "next/server";
import { completeTask, createTask, publicState } from "@/lib/store";
import type { Role } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action: "create" | "complete";
      title?: string;
      notes?: string;
      sectionId?: string | null;
      taskId?: string;
      role: Role;
    };
    if (body.action === "create") {
      if (!body.title?.trim()) throw new Error("Task title is required.");
      createTask({ title: body.title.trim(), notes: body.notes, sectionId: body.sectionId }, body.role);
    } else if (body.action === "complete" && body.taskId) {
      completeTask(body.taskId, body.role);
    }
    return NextResponse.json(publicState());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Task failed" }, { status: 400 });
  }
}
