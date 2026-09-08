import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import type { WorkspaceMode } from "./types";

let testDataRoot: string | undefined;

export function setStoreDataRootForTests(root: string | undefined): void {
  testDataRoot = root;
}

function dataRoot(): string {
  return testDataRoot ?? process.cwd();
}

export function storePaths(mode: WorkspaceMode): {
  dataDir: string;
  storePath: string;
  uploadsDir: string;
} {
  const root = dataRoot();
  if (mode === "training") {
    return {
      dataDir: path.join(root, "data", "runtime-training"),
      storePath: path.join(root, "data", "runtime-training", "workspace.json"),
      uploadsDir: path.join(root, "data", "uploads-training"),
    };
  }
  return {
    dataDir: path.join(root, "data", "runtime"),
    storePath: path.join(root, "data", "runtime", "workspace.json"),
    uploadsDir: path.join(root, "data", "uploads"),
  };
}

export function ensureDataDir(mode: WorkspaceMode): string {
  const { dataDir } = storePaths(mode);
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  return dataDir;
}

export function wipeUploadsDir(mode: WorkspaceMode): void {
  const { uploadsDir } = storePaths(mode);
  if (existsSync(uploadsDir)) rmSync(uploadsDir, { recursive: true, force: true });
}
