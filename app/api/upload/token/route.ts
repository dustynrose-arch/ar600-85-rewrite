import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isAllowedBlobUploadPath } from "@/lib/persist";
import { serverEnv } from "@/lib/server-env";
import { canUpload } from "@/lib/roles";
import { readState } from "@/lib/store";
import { MAX_UPLOAD_BYTES } from "@/lib/types";
import { isWorkspaceMode, modeFromRequest, type WorkspaceMode } from "@/lib/workspace-mode";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const mode = modeFromRequest(request);
  const role = (await readState(mode)).role;
  if (!canUpload(role)) {
    return NextResponse.json({ error: "Reviewers cannot upload files. Switch to Editor or Approver." }, { status: 403 });
  }
  if (!serverEnv("BLOB_READ_WRITE_TOKEN")) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN is required for browser uploads on Vercel." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let payloadMode: WorkspaceMode = mode;
        if (clientPayload) {
          try {
            const parsed = JSON.parse(clientPayload) as { mode?: string };
            if (isWorkspaceMode(parsed.mode)) payloadMode = parsed.mode;
          } catch {
            throw new Error("Invalid upload payload.");
          }
        }
        if (payloadMode !== mode) {
          throw new Error("Upload mode does not match the workspace cookie.");
        }
        if (!isAllowedBlobUploadPath(pathname, payloadMode)) {
          throw new Error("Upload path must stay under the active Live or Training prefix.");
        }
        return {
          addRandomSuffix: false,
          allowOverwrite: true,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          cacheControlMaxAge: 60,
          tokenPayload: JSON.stringify({ mode: payloadMode }),
        };
      },
      onUploadCompleted: async () => {
        /* Metadata is recorded by POST /api/upload after the client finishes. */
      },
    });
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start upload." },
      { status: 400 },
    );
  }
}
