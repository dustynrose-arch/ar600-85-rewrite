import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, test } from "node:test";
import {
  blobUploadPath,
  blobWorkspacePath,
  isAllowedBlobUploadPath,
  persistKind,
  readUploadBytes,
  readWorkspaceJson,
  setPersistKindForTests,
  wipeUploads,
  writeUploadBytes,
  writeWorkspaceJson,
} from "./persist.ts";
import { setStoreDataRootForTests, storePaths } from "./store-paths.ts";
import { secretsMatch, wgAccessCookieValid, wgAccessCookieValue } from "./wg-access.ts";

afterEach(() => {
  setPersistKindForTests(undefined);
  setStoreDataRootForTests(undefined);
});

test("blob pathnames keep live and training isolated", () => {
  assert.equal(blobWorkspacePath("live"), "ar60085/live/workspace.json");
  assert.equal(blobWorkspacePath("training"), "ar60085/training/workspace.json");
  assert.notEqual(blobWorkspacePath("live"), blobWorkspacePath("training"));
  assert.equal(blobUploadPath("live", "abc.docx"), "ar60085/live/uploads/abc.docx");
  assert.equal(blobUploadPath("training", "abc.docx"), "ar60085/training/uploads/abc.docx");
  assert.equal(isAllowedBlobUploadPath("ar60085/live/uploads/abc.docx", "live"), true);
  assert.equal(isAllowedBlobUploadPath("ar60085/training/uploads/abc.docx", "live"), false);
  assert.equal(isAllowedBlobUploadPath("ar60085/live/workspace.json", "live"), false);
  assert.equal(isAllowedBlobUploadPath("ar60085/live/uploads/../workspace.json", "live"), false);
});

test("memory persist keeps live and training workspace JSON and uploads apart", async () => {
  setPersistKindForTests("memory");
  assert.equal(persistKind(), "memory");
  await writeWorkspaceJson("live", JSON.stringify({ body: "live" }));
  await writeWorkspaceJson("training", JSON.stringify({ body: "training" }));
  await writeUploadBytes("live", "live.bin", Buffer.from("live-file"));
  await writeUploadBytes("training", "practice.bin", Buffer.from("practice-file"));
  assert.equal(JSON.parse((await readWorkspaceJson("live")) ?? "{}").body, "live");
  assert.equal(JSON.parse((await readWorkspaceJson("training")) ?? "{}").body, "training");
  assert.equal((await readUploadBytes("live", "live.bin")).toString(), "live-file");
  assert.equal((await readUploadBytes("training", "practice.bin")).toString(), "practice-file");
  await wipeUploads("training");
  assert.equal((await readUploadBytes("live", "live.bin")).toString(), "live-file");
  await assert.rejects(() => readUploadBytes("training", "practice.bin"));
});

test("filesystem persist under a temp root keeps live and training files apart", async () => {
  setPersistKindForTests("filesystem");
  const root = mkdtempSync(path.join(tmpdir(), "ar60085-persist-"));
  setStoreDataRootForTests(root);
  try {
    await writeWorkspaceJson("live", JSON.stringify({ body: "live" }));
    await writeWorkspaceJson("training", JSON.stringify({ body: "training" }));
    await writeUploadBytes("live", "live.bin", Buffer.from("live-file"));
    await writeUploadBytes("training", "practice.bin", Buffer.from("practice-file"));
    assert.equal(JSON.parse((await readWorkspaceJson("live")) ?? "{}").body, "live");
    assert.equal(JSON.parse((await readWorkspaceJson("training")) ?? "{}").body, "training");
    assert.notEqual(storePaths("live").storePath, storePaths("training").storePath);
    await wipeUploads("training");
    assert.equal((await readUploadBytes("live", "live.bin")).toString(), "live-file");
    await assert.rejects(() => readUploadBytes("training", "practice.bin"));
  } finally {
    setStoreDataRootForTests(undefined);
  }
});

test("WG access cookie HMAC accepts only the matching secret", async () => {
  const value = await wgAccessCookieValue("correct-horse");
  assert.equal(await wgAccessCookieValid(value, "correct-horse"), true);
  assert.equal(await wgAccessCookieValid(value, "other-secret"), false);
  assert.equal(await wgAccessCookieValid(undefined, "correct-horse"), false);
  assert.equal(await wgAccessCookieValid("nope", "correct-horse"), false);
  assert.equal(secretsMatch("correct-horse", "correct-horse"), true);
  assert.equal(secretsMatch("correct-horse", "correct-horses"), false);
});
