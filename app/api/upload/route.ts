import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { publicState, readState, recordUpload, sha256 } from "@/lib/store";
import { canUpload } from "@/lib/roles";
import { MAX_UPLOAD_BYTES } from "@/lib/types";

export const runtime = "nodejs";

const ALLOWED = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const role = readState().role;
  if (!canUpload(role)) {
    return NextResponse.json(
      { error: "Reviewers cannot upload files. Switch to Editor or Approver." },
      { status: 403 },
    );
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a PDF or DOCX file." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File exceeds the 25 MB limit." }, { status: 400 });
  }
  const mime = file.type || "application/octet-stream";
  const name = file.name.toLowerCase();
  if (!ALLOWED.has(mime) && !name.endsWith(".pdf") && !name.endsWith(".docx") && !name.endsWith(".doc")) {
    return NextResponse.json({ error: "Only PDF and DOCX uploads are accepted." }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const digest = sha256(buffer);
  const dir = path.join(process.cwd(), "data", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${digest.slice(0, 16)}-${file.name.replace(/[^\w.\-]+/g, "_")}`), buffer);
  recordUpload({
    filename: file.name,
    mimeType: mime,
    sizeBytes: file.size,
    sha256: digest,
    uploadedBy: role,
  });
  return NextResponse.json(publicState());
}
