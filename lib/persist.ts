import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { WorkspaceMode } from "./types.ts";
import { serverEnv } from "./server-env.ts";
import { storePaths } from "./store-paths.ts";

export type PersistKind = "filesystem" | "blob" | "memory";

export class PersistError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PersistError";
  }
}

/** Hard error: Vercel serverless disk is ephemeral. Drafts must live in Blob. */
export const VERCEL_REQUIRES_BLOB =
  "Vercel deploys require a private Blob store (BLOB_READ_WRITE_TOKEN, or BLOB_STORE_ID plus VERCEL_OIDC_TOKEN). data/runtime/ is ephemeral and must not hold Live or Training drafts.";

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
  // Never fall back to serverless disk. Cold start would wipe WG drafts.
  if (onVercelRuntime()) {
    throw new PersistError(VERCEL_REQUIRES_BLOB);
  }
  return "filesystem";
}

export function blobConfigured(): boolean {
  if (serverEnv("BLOB_READ_WRITE_TOKEN")) return true;
  return Boolean(serverEnv("BLOB_STORE_ID") && serverEnv("VERCEL_OIDC_TOKEN"));
}

/**
 * Prefer the static RW token. On Vercel the SDK otherwise picks OIDC whenever
 * BLOB_STORE_ID + VERCEL_OIDC_TOKEN exist; a 403 there becomes Application error.
 */
export function blobSdkOptions(): { token: string } | Record<string, never> {
  const token = serverEnv("BLOB_READ_WRITE_TOKEN");
  return token ? { token } : {};
}

function wrapBlobError(op: string, error: unknown): PersistError {
  if (error instanceof PersistError) return error;
  const message = error instanceof Error ? error.message : String(error);
  return new PersistError(
    `Private Blob ${op} failed. Confirm BLOB_READ_WRITE_TOKEN matches this private store. ${message}`,
  );
}

function onVercelRuntime(): boolean {
  if (serverEnv("VERCEL") !== "1") return false;
  // Allow `next build` on Vercel to compile before the Blob token is read at request time.
  return serverEnv("NEXT_PHASE") !== "phase-production-build";
}

export function kvLockConfigured(): boolean {
  return Boolean(serverEnv("KV_REST_API_URL") && serverEnv("KV_REST_API_TOKEN"));
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
    try {
      await put(blobWorkspacePath(mode), json, {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: BLOB_CACHE_SECONDS,
        contentType: "application/json; charset=utf-8",
        ...blobSdkOptions(),
      });
    } catch (error) {
      throw wrapBlobError("PUT workspace", error);
    }
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
    try {
      await put(blobUploadPath(mode, storedAs), buffer, {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: BLOB_CACHE_SECONDS,
        multipart: buffer.length > 4 * 1024 * 1024,
        ...blobSdkOptions(),
      });
    } catch (error) {
      throw wrapBlobError("PUT upload", error);
    }
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
    const auth = blobSdkOptions();
    let cursor: string | undefined;
    try {
      do {
        const page = await list({ prefix, cursor, limit: 200, ...auth });
        if (page.blobs.length > 0) {
          await del(page.blobs.map((blob) => blob.url), auth);
        }
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
    } catch (error) {
      throw wrapBlobError("delete training uploads", error);
    }
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
  let result: Awaited<ReturnType<typeof get>>;
  try {
    result = await get(pathname, { access: "private", useCache: false, ...blobSdkOptions() });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/\b404\b|not found/i.test(message)) return null;
    throw wrapBlobError("GET", error);
  }
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return Buffer.from(await new Response(result.stream).arrayBuffer());
}

export async function withWorkspaceLock<T>(mode: WorkspaceMode, fn: () => Promise<T>): Promise<T> {
  if (!kvLockConfigured()) return fn();
  const key = `ar60085:lock:${mode}`;
  const acquired = await kvSetNx(key, 12);
  if (acquired === "unavailable") return fn();
  if (!acquired) {
    for (let attempt = 0; attempt < 24; attempt += 1) {
      await sleep(50 + attempt * 20);
      const retry = await kvSetNx(key, 12);
      if (retry === "unavailable") return fn();
      if (retry) {
        try {
          return await fn();
        } finally {
          await kvDel(key);
        }
      }
    }
    throw new PersistError("Workspace is busy. Retry the save.");
  }
  try {
    return await fn();
  } finally {
    await kvDel(key);
  }
}

async function kvSetNx(key: string, ttlSeconds: number): Promise<boolean | "unavailable"> {
  const result = await kvPipeline([["SET", key, "1", "NX", "EX", String(ttlSeconds)]]);
  if (result === "unavailable") return "unavailable";
  return result === "OK";
}

async function kvDel(key: string): Promise<void> {
  await kvPipeline([["DEL", key]]);
}

/** Upstash/Vercel KV pipeline: `{"result":[{"result":"OK"}]}` or `["OK"]`. */
export function parseKvPipelineFirst(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const result = (payload as { result?: unknown }).result;
  const first = Array.isArray(result) ? result[0] : result;
  if (first == null) return null;
  if (typeof first === "string") return first;
  if (Array.isArray(first)) {
    const value = first.find((item) => item != null);
    return value == null ? null : String(value);
  }
  if (typeof first === "object" && "result" in first) {
    const inner = (first as { result?: unknown }).result;
    return inner == null ? null : String(inner);
  }
  return null;
}

async function kvPipeline(commands: string[][]): Promise<string | null | "unavailable"> {
  const url = serverEnv("KV_REST_API_URL");
  const token = serverEnv("KV_REST_API_TOKEN");
  if (!url || !token) return "unavailable";
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
    });
    if (!response.ok) return "unavailable";
    return parseKvPipelineFirst(await response.json());
  } catch {
    return "unavailable";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
