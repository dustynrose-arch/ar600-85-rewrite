import type { WorkspaceMode } from "./types.ts";

type PublicState = Awaited<ReturnType<typeof import("./store.ts").publicState>>;

export async function loadPublicStateOrError(
  mode: WorkspaceMode,
): Promise<{ ok: true; state: PublicState } | { ok: false; message: string }> {
  try {
    const { publicState } = await import("./store.ts");
    return { ok: true, state: await publicState(mode) };
  } catch (error) {
    const message = error instanceof Error && error.message.trim()
      ? error.message
      : "Draft storage failed to load. Confirm BLOB_READ_WRITE_TOKEN on Production and Redeploy.";
    return { ok: false, message };
  }
}
