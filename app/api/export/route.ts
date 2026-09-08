import { NextResponse } from "next/server";
import { buildDraftDocx, buildSummaryOfChangeDocx } from "@/lib/export-docx";
import { readState } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") ?? "working-copy";
  const summary = kind === "summary" || kind === "summary-of-change";
  const buffer = summary ? await buildSummaryOfChangeDocx(readState()) : await buildDraftDocx(readState());
  const filename = summary
    ? "AR600-85-Summary-of-Change-WORKING-COPY-DRAFT.docx"
    : "AR600-85-Rewrite-WORKING-COPY-DRAFT.docx";
  return new NextResponse(Uint8Array.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Draft-Stamp": "DRAFT-WORKING-COPY",
      "X-Export-Kind": summary ? "summary-of-change" : "working-copy",
    },
  });
}
