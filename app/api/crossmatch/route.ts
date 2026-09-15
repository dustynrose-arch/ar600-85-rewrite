import { NextResponse } from "next/server";
import { flattenSections } from "@/lib/baseline";
import { crossmatchDocument } from "@/lib/crossmatch";
import { extractDocument } from "@/lib/document-extract";
import { canUpload } from "@/lib/roles";
import { loadUploadBytes, publicState, readState, updateUploadFindings } from "@/lib/store";
import { REJECT_REVIEWER } from "@/lib/upload-guard";
import { modeFromRequest } from "@/lib/workspace-mode";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const mode = modeFromRequest(request);
  const role = (await readState(mode)).role;
  if (!canUpload(role)) {
    return NextResponse.json({ error: REJECT_REVIEWER }, { status: 403 });
  }
  const body = (await request.json()) as { uploadId?: string };
  const state = await readState(mode);
  const upload = state.uploads.find((item) => item.id === body.uploadId);
  if (!upload) {
    return NextResponse.json({ error: "Upload not found." }, { status: 404 });
  }
  if (!upload.storedAs) {
    return NextResponse.json({ error: "This older upload cannot be re-compared. Upload the file again." }, { status: 400 });
  }
  try {
    const buffer = await loadUploadBytes(upload.storedAs, mode);
    const chunks = await extractDocument(upload.filename, buffer);
    const findings = crossmatchDocument({
      filename: upload.filename,
      chunks,
      draftSections: structuredClone(state.workingSections),
      originalSections: Object.fromEntries(flattenSections().map((section) => [section.id, section])),
    });
    await updateUploadFindings(upload.id, findings, role, mode);
    return NextResponse.json(await publicState(mode));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Compare failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
