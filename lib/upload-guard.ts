import { MAX_UPLOAD_BYTES } from "./types.ts";

export const UPLOAD_EXTENSIONS = [".docx", ".pdf", ".pptx"] as const;

export const UPLOAD_ACCEPT =
  ".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation";

export const UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export const REJECT_WRONG_TYPE = "Only .docx, .pdf, and .pptx files are accepted.";
export const REJECT_LEGACY_TYPE = "Old .doc and .ppt files are not accepted. Use .docx, .pdf, or .pptx.";
export const REJECT_OVER_SIZE = "File exceeds the 25 MB limit.";
export const REJECT_REVIEWER = "Reviewers cannot upload files. Switch to Editor or Approver.";

export function uploadExtension(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".docx")) return ".docx";
  if (lower.endsWith(".pptx")) return ".pptx";
  if (lower.endsWith(".pdf")) return ".pdf";
  if (lower.endsWith(".doc")) return ".doc";
  if (lower.endsWith(".ppt")) return ".ppt";
  const dot = lower.lastIndexOf(".");
  return dot >= 0 ? lower.slice(dot) : "";
}

export function isAllowedUploadName(filename: string): boolean {
  const ext = uploadExtension(filename);
  return (UPLOAD_EXTENSIONS as readonly string[]).includes(ext);
}

export function rejectUploadReason(file: { name: string; size: number; type?: string }): string | null {
  const ext = uploadExtension(file.name);
  if (ext === ".doc" || ext === ".ppt") return REJECT_LEGACY_TYPE;
  if (!(UPLOAD_EXTENSIONS as readonly string[]).includes(ext) && !UPLOAD_MIME_TYPES.has(file.type ?? "")) {
    return REJECT_WRONG_TYPE;
  }
  if (!(UPLOAD_EXTENSIONS as readonly string[]).includes(ext)) return REJECT_WRONG_TYPE;
  if (file.size > MAX_UPLOAD_BYTES) return REJECT_OVER_SIZE;
  return null;
}

export function storedUploadName(sha256: string, filename: string): string {
  return `${sha256.slice(0, 16)}-${filename.replace(/[^\w.\-]+/g, "_")}`;
}
