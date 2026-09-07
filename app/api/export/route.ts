import { NextResponse } from "next/server";
import { buildDraftDocx } from "@/lib/export-docx";
import { readState } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const buffer = await buildDraftDocx(readState());
  return new NextResponse(Uint8Array.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="AR600-85-Rewrite-WORKING-COPY-DRAFT.docx"',
      "X-Draft-Stamp": "DRAFT-WORKING-COPY",
    },
  });
}
