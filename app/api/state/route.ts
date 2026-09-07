import { NextResponse } from "next/server";
import { publicState, setRole, touchActivity } from "@/lib/store";
import type { Role } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(publicState());
}

export async function POST(request: Request) {
  const body = (await request.json()) as { action?: string; role?: Role };
  if (body.action === "role" && body.role) {
    setRole(body.role);
  } else if (body.action === "touch") {
    touchActivity();
  }
  return NextResponse.json(publicState());
}
