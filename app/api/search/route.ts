import { NextResponse } from "next/server";
import { searchBaseline } from "@/lib/search";

export const runtime = "nodejs";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return NextResponse.json({ hits: searchBaseline(searchParams.get("q") ?? "") });
}
