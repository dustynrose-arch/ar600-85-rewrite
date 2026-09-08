import { NextResponse } from "next/server";
import { buildDraftDocx, buildSummaryOfChangeDocx } from "@/lib/export-docx";
import { readState } from "@/lib/store";
import { modeFromRequest } from "@/lib/workspace-mode";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const mode = modeFromRequest(request);
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") ?? "working-copy";
  const summary = kind === "summary" || kind === "summary-of-change";
  const training = mode === "training";
  const buffer = summary
    ? await buildSummaryOfChangeDocx(readState(mode), { training })
    : await buildDraftDocx(readState(mode), { training });
  const filename = summary
    ? training
      ? "AR600-85-Summary-of-Change-TRAINING-DRAFT.docx"
      : "AR600-85-Summary-of-Change-WORKING-COPY-DRAFT.docx"
    : training
      ? "AR600-85-Rewrite-TRAINING-DRAFT.docx"
      : "AR600-85-Rewrite-WORKING-COPY-DRAFT.docx";
  return new NextResponse(Uint8Array.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Draft-Stamp": training ? "TRAINING-DRAFT-WORKING-COPY" : "DRAFT-WORKING-COPY",
      "X-Export-Kind": summary ? "summary-of-change" : "working-copy",
    },
  });
}
