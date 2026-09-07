import { NextResponse } from "next/server";
import { publicState, saveSection } from "@/lib/store";
import type { Role } from "@/lib/types";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      sectionId: string;
      body: string;
      title?: string;
      role: Role;
    };
    saveSection(body.sectionId, body.body, body.title, body.role);
    return NextResponse.json(publicState());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Save failed" }, { status: 400 });
  }
}
