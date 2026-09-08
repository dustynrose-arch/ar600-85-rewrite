import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { flattenSections } from "@/lib/baseline";
import { crossmatchDocument } from "@/lib/crossmatch";
import { extractDocument } from "@/lib/document-extract";
import { canUpload } from "@/lib/roles";
import { publicState, readState, recordUpload, sha256 } from "@/lib/store";
import type { CrossmatchRow } from "@/lib/types";
import { REJECT_REVIEWER, REJECT_WRONG_TYPE, rejectUploadReason, storedUploadName } from "@/lib/upload-guard";

export const runtime = "nodejs";
export const maxDuration = 60;

function unreadRow(filename: string): CrossmatchRow {
  return {
    id: randomUUID(),
    sourceFile: filename,
    locator: "document",
    locationCite: "(unreadable)",
    sectionId: null,
    draftExcerpt: "",
    documentExcerpt: "",
    verdict: "unclear",
    reason: "The file was stored, but its text could not be read for compare. Nothing in your draft was changed.",
  };
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const role = readState().role;
  if (!canUpload(role)) {
    return NextResponse.json({ error: REJECT_REVIEWER }, { status: 403 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: REJECT_WRONG_TYPE }, { status: 400 });
  }
  const rejected = rejectUploadReason({ name: file.name, size: file.size, type: file.type });
  if (rejected) {
    return NextResponse.json({ error: rejected }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const digest = sha256(buffer);
  const storedAs = storedUploadName(digest, file.name);
  const dir = path.join(process.cwd(), "data", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, storedAs), buffer);

  const state = readState();
  let findings: CrossmatchRow[] = [];
  try {
    const chunks = await extractDocument(file.name, buffer);
    findings = crossmatchDocument({
      filename: file.name,
      chunks,
      draftSections: structuredClone(state.workingSections),
      originalSections: Object.fromEntries(flattenSections().map((section) => [section.id, section])),
    });
  } catch {
    findings = [unreadRow(file.name)];
  }

  recordUpload({
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    sha256: digest,
    storedAs,
    uploadedBy: role,
    findings,
  });

  return NextResponse.json(publicState());
}
