import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { flattenSections } from "@/lib/baseline";
import { crossmatchDocument } from "@/lib/crossmatch";
import { extractDocument } from "@/lib/document-extract";
import { persistKind } from "@/lib/persist";
import { canUpload } from "@/lib/roles";
import { loadUploadBytes, publicState, readState, recordUpload, sha256, storeUploadBytes } from "@/lib/store";
import type { CrossmatchRow } from "@/lib/types";
import { REJECT_REVIEWER, REJECT_WRONG_TYPE, rejectUploadReason, storedUploadName } from "@/lib/upload-guard";
import { modeFromRequest } from "@/lib/workspace-mode";

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

async function compareBuffer(
  filename: string,
  buffer: Buffer,
  draftSections: Awaited<ReturnType<typeof readState>>["workingSections"],
): Promise<CrossmatchRow[]> {
  try {
    const chunks = await extractDocument(filename, buffer);
    return crossmatchDocument({
      filename,
      chunks,
      draftSections: structuredClone(draftSections),
      originalSections: Object.fromEntries(flattenSections().map((section) => [section.id, section])),
    });
  } catch {
    return [unreadRow(filename)];
  }
}

export async function POST(request: Request) {
  const mode = modeFromRequest(request);
  const role = (await readState(mode)).role;
  if (!canUpload(role)) {
    return NextResponse.json({ error: REJECT_REVIEWER }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      storedAs?: string;
      filename?: string;
      mimeType?: string;
      sizeBytes?: number;
      sha256?: string;
    };
    if (!body.storedAs || !body.filename || !body.sha256 || body.sizeBytes == null) {
      return NextResponse.json({ error: "Upload metadata is incomplete." }, { status: 400 });
    }
    const rejected = rejectUploadReason({
      name: body.filename,
      size: body.sizeBytes,
      type: body.mimeType,
    });
    if (rejected) {
      return NextResponse.json({ error: rejected }, { status: 400 });
    }
    const buffer = await loadUploadBytes(body.storedAs, mode);
    const digest = sha256(buffer);
    if (digest !== body.sha256) {
      return NextResponse.json({ error: "Upload hash does not match the stored file." }, { status: 400 });
    }
    const state = await readState(mode);
    const findings = await compareBuffer(body.filename, buffer, state.workingSections);
    await recordUpload(
      {
        filename: body.filename,
        mimeType: body.mimeType || "application/octet-stream",
        sizeBytes: body.sizeBytes,
        sha256: digest,
        storedAs: body.storedAs,
        uploadedBy: role,
        findings,
      },
      mode,
    );
    return NextResponse.json(await publicState(mode));
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: REJECT_WRONG_TYPE }, { status: 400 });
  }
  const rejected = rejectUploadReason({ name: file.name, size: file.size, type: file.type });
  if (rejected) {
    return NextResponse.json({ error: rejected }, { status: 400 });
  }
  if (persistKind() === "blob" && file.size > 4 * 1024 * 1024) {
    return NextResponse.json(
      {
        error:
          "On Vercel, files over 4 MB must use the browser Blob upload path. Refresh and try again, or check BLOB_READ_WRITE_TOKEN.",
      },
      { status: 413 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const digest = sha256(buffer);
  const storedAs = storedUploadName(digest, file.name);
  await storeUploadBytes(storedAs, buffer, mode);

  const state = await readState(mode);
  const findings = await compareBuffer(file.name, buffer, state.workingSections);

  await recordUpload(
    {
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      sha256: digest,
      storedAs,
      uploadedBy: role,
      findings,
    },
    mode,
  );

  return NextResponse.json(await publicState(mode));
}
