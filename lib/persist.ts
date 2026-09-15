import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { WorkspaceMode } from "./types.ts";
import { storePaths } from "./store-paths.ts";

export type PersistKind = "filesystem" | "blob" | "memory";

type MemoryStore = {
  workspace: Partial<Record<WorkspaceMode, string>>;
  uploads: Record<WorkspaceMode, Map<string, Buffer>>;
};

let testKind: PersistKind | undefined;
let memory: MemoryStore | undefined;

const BLOB_CACHE_SECONDS = 60;

export function setPersistKindForTests(kind: PersistKind | undefined): void {
  testKind = kind;
  if (kind === "memory") {
    memory = {
      workspace: {},
      uploads: { live: new Map(), training: new Map() },
    };
  } else {
    memory = undefined;
  }
}

export function persistKind(): PersistKind {
  if (testKind) return testKind;
  if (blobConfigured()) return "blob";
  return "filesystem";
}

export function blobConfigured(): boolean {
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) return true;
  return Boolean(process.env.BLOB_STORE_ID?.trim() && process.env.VERCEL_OIDC_TOKEN?.trim());
}

export function kvLockConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL?.trim() && process.env.KV_REST_API_TOKEN?.trim());
}

/** Live and Training never share a pathname. */
export function blobWorkspacePath(mode: WorkspaceMode): string {
  return `ar60085/${mode}/workspace.json`;
}

export function blobUploadPath(mode: WorkspaceMode, storedAs: string): string {
  const safe = storedAs.replace(/[/\\]/g, "_");
  return `ar60085/${mode}/uploads/${safe}`;
}

export function blobUploadPrefix(mode: WorkspaceMode): string {
  return `ar60085/${mode}/uploads/`;
}

export function isAllowedBlobUploadPath(pathname: string, mode: WorkspaceMode): boolean {
  const expected = blobUploadPrefix(mode);
  return pathname.startsWith(expected) && !pathname.includes("..") && pathname !== blobWorkspacePath(mode);
}

export async function readWorkspaceJson(mode: WorkspaceMode): Promise<string | null> {
  const kind = persistKind();
  if (kind === "memory") return memory?.workspace[mode] ?? null;
  if (kind === "blob") return readBlobText(blobWorkspacePath(mode));
  const { storePath } = storePaths(mode);
  if (!existsSync(storePath)) return null;
  return readFileSync(storePath, "utf8");
}

export async function writeWorkspaceJson(mode: WorkspaceMode, json: string): Promise<void> {
  const kind = persistKind();
  if (kind === "memory") {
    if (!memory) setPersistKindForTests("memory");
    memory!.workspace[mode] = json;
    return;
  }
  if (kind === "blob") {
    const { put } = await import("@vercel/blob");
    await put(blobWorkspacePath(mode), json, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: BLOB_CACHE_SECONDS,
      contentType: "application/json; charset=utf-8",
    });
    return;
  }
  const { dataDir, storePath } = storePaths(mode);
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  writeFileSync(storePath, json);
}

export async function readUploadBytes(mode: WorkspaceMode, storedAs: string): Promise<Buffer> {
  const kind = persistKind();
  if (kind === "memory") {
    const buf = memory?.uploads[mode]?.get(storedAs);
    if (!buf) throw new Error("Upload not found.");
    return buf;
  }
  if (kind === "blob") {
    const buf = await readBlobBuffer(blobUploadPath(mode, storedAs));
    if (!buf) throw new Error("Upload not found.");
    return buf;
  }
  const filePath = path.join(storePaths(mode).uploadsDir, storedAs);
  if (!existsSync(filePath)) throw new Error("Upload not found.");
  return readFileSync(filePath);
}

export async function writeUploadBytes(mode: WorkspaceMode, storedAs: string, buffer: Buffer): Promise<void> {
  const kind = persistKind();
  if (kind === "memory") {
    if (!memory) setPersistKindForTests("memory");
    memory!.uploads[mode]!.set(storedAs, buffer);
    return;
  }
  if (kind === "blob") {
    const { put } = await import("@vercel/blob");
    await put(blobUploadPath(mode, storedAs), buffer, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: BLOB_CACHE_SECONDS,
      multipart: buffer.length > 4 * 1024 * 1024,
    });
    return;
  }
  const { uploadsDir } = storePaths(mode);
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  writeFileSync(path.join(uploadsDir, storedAs), buffer);
}

export async function wipeUploads(mode: WorkspaceMode): Promise<void> {
  const kind = persistKind();
  if (kind === "memory") {
    memory?.uploads[mode]?.clear();
    return;
  }
  if (kind === "blob") {
    const { list, del } = await import("@vercel/blob");
    const prefix = blobUploadPrefix(mode);
    let cursor: string | undefined;
    do {
      const page = await list({ prefix, cursor, limit: 200 });
      if (page.blobs.length > 0) {
        await del(page.blobs.map((blob) => blob.url));
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return;
  }
  const { uploadsDir } = storePaths(mode);
  if (existsSync(uploadsDir)) rmSync(uploadsDir, { recursive: true, force: true });
}

async function readBlobText(pathname: string): Promise<string | null> {
  const buf = await readBlobBuffer(pathname);
  return buf ? buf.toString("utf8") : null;
}

async function readBlobBuffer(pathname: string): Promise<Buffer | null> {
  const { get } = await import("@vercel/blob");
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return null;
  return Buffer.from(await new Response(result.stream).arrayBuffer());
}

export async function withWorkspaceLock<T>(mode: WorkspaceMode, fn: () => Promise<T>): Promise<T> {
  if (!kvLockConfigured()) return fn();
  const key = `ar60085:lock:${mode}`;
  const acquired = await kvSetNx(key, 12);
  if (!acquired) {
    for (let attempt = 0; attempt < 24; attempt += 1) {
      await sleep(50 + attempt * 20);
      if (await kvSetNx(key, 12)) {
        try {
          return await fn();
        } finally {
          await kvDel(key);
        }
      }
    }
    throw new Error("Workspace is busy. Retry the save.");
  }
  try {
    return await fn();
  } finally {
    await kvDel(key);
  }
}

async function kvSetNx(key: string, ttlSeconds: number): Promise<boolean> {
  const result = await kvPipeline([["SET", key, "1", "NX", "EX", String(ttlSeconds)]]);
  return result === "OK";
}

async function kvDel(key: string): Promise<void> {
  await kvPipeline([["DEL", key]]);
}

async function kvPipeline(commands: string[][]): Promise<string | null> {
  const url = process.env.KV_REST_API_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim();
  if (!url || !token) return null;
  const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { result?: unknown[] };
  const first = payload.result?.[0];
  if (Array.isArray(first)) return first[1] == null ? (first[0] as string | null) : String(first[1]);
  if (first == null) return null;
  if (typeof first === "string") return first;
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
