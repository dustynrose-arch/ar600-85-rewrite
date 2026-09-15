/**
 * Vercel Blob Authorization must be `Bearer <raw BLOB_READ_WRITE_TOKEN>`.
 * Production has seen the env value pasted as a .env snippet, which the SDK
 * then sends as:
 *   Bearer BLOB_STORE_ID="store_…" BLOB_READ_WRITE_TOKEN="vercel_blob_rw_…"
 */

const GENERIC_STORAGE_MESSAGE =
  "Draft storage failed to load. Confirm BLOB_READ_WRITE_TOKEN on Production and Redeploy.";

const GENERIC_BLOB_OP_MESSAGE =
  "Private Blob request failed. Confirm BLOB_READ_WRITE_TOKEN matches this private store.";

export function sanitizeBlobReadWriteToken(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (/BLOB_READ_WRITE_TOKEN\s*=/.test(trimmed)) {
    const assignment = trimmed.match(
      /BLOB_READ_WRITE_TOKEN\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/,
    );
    const extracted = (assignment?.[1] ?? assignment?.[2] ?? assignment?.[3] ?? "").trim();
    return extracted ? sanitizeBlobReadWriteToken(extracted) : "";
  }

  if (/BLOB_STORE_ID\s*=/.test(trimmed)) return "";
  if (/^[A-Z][A-Z0-9_]*\s*=/.test(trimmed)) return "";

  let token = trimmed;
  if (
    (token.startsWith('"') && token.endsWith('"') && token.length >= 2) ||
    (token.startsWith("'") && token.endsWith("'") && token.length >= 2)
  ) {
    token = token.slice(1, -1).trim();
  }

  if (!token) return "";
  if (/^store_[A-Za-z0-9]+$/.test(token)) return "";
  if (/\s/.test(token) || token.includes("=")) return "";
  return token;
}

export function containsBlobSecretMaterial(text: string): boolean {
  return (
    /vercel_blob_rw_/i.test(text) ||
    /\bBearer\s+\S/i.test(text) ||
    /BLOB_READ_WRITE_TOKEN\s*=\s*["']?vercel_blob/i.test(text)
  );
}

export function publicStorageErrorMessage(error: unknown): string {
  if (!(error instanceof Error) || !error.message.trim()) return GENERIC_STORAGE_MESSAGE;
  if (containsBlobSecretMaterial(error.message)) return GENERIC_STORAGE_MESSAGE;
  return error.message;
}

export function publicBlobOpErrorMessage(op: string, error: unknown): string {
  if (error instanceof Error && error.name === "PersistError") {
    if (containsBlobSecretMaterial(error.message)) return GENERIC_BLOB_OP_MESSAGE;
    return error.message;
  }
  return `Private Blob ${op} failed. Confirm BLOB_READ_WRITE_TOKEN matches this private store.`;
}
