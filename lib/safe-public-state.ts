import { publicStorageErrorMessage } from "./blob-token.ts";
import type { WorkspaceMode } from "./types.ts";

type PublicState = Awaited<ReturnType<typeof import("./store.ts").publicState>>;

export async function loadPublicStateOrError(
  mode: WorkspaceMode,
): Promise<{ ok: true; state: PublicState } | { ok: false; message: string }> {
  try {
    const { publicState } = await import("./store.ts");
    return { ok: true, state: await publicState(mode) };
  } catch (error) {
    return { ok: false, message: publicStorageErrorMessage(error) };
  }
}
