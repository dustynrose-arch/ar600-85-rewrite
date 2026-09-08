import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, test } from "node:test";
import { canResetTraining } from "./roles.ts";
import { setStoreDataRootForTests, storePaths, wipeUploadsDir } from "./store-paths.ts";

afterEach(() => {
  setStoreDataRootForTests(undefined);
});

function tempRoot(): string {
  const root = mkdtempSync(path.join(tmpdir(), "ar60085-store-"));
  setStoreDataRootForTests(root);
  return root;
}

test("storePaths keep live and training on separate directories", () => {
  const live = storePaths("live");
  const training = storePaths("training");
  assert.notEqual(live.storePath, training.storePath);
  assert.notEqual(live.uploadsDir, training.uploadsDir);
  assert.match(live.storePath, /data[/\\]runtime[/\\]workspace\.json$/);
  assert.match(training.storePath, /data[/\\]runtime-training[/\\]workspace\.json$/);
  assert.match(live.uploadsDir, /data[/\\]uploads$/);
  assert.match(training.uploadsDir, /data[/\\]uploads-training$/);
});

test("writes to the training store file do not overwrite live workspace.json", () => {
  const root = tempRoot();
  const live = storePaths("live");
  const training = storePaths("training");
  mkdirSync(live.dataDir, { recursive: true });
  mkdirSync(training.dataDir, { recursive: true });
  writeFileSync(live.storePath, JSON.stringify({ body: "live" }));
  writeFileSync(training.storePath, JSON.stringify({ body: "training" }));
  assert.equal(JSON.parse(readFileSync(live.storePath, "utf8")).body, "live");
  assert.equal(JSON.parse(readFileSync(training.storePath, "utf8")).body, "training");
  assert.equal(live.storePath.startsWith(root), true);
  assert.notEqual(live.storePath, training.storePath);
});

test("wipeUploadsDir on training leaves live uploads in place", () => {
  tempRoot();
  const live = storePaths("live");
  const training = storePaths("training");
  mkdirSync(live.uploadsDir, { recursive: true });
  mkdirSync(training.uploadsDir, { recursive: true });
  writeFileSync(path.join(live.uploadsDir, "live.bin"), "live");
  writeFileSync(path.join(training.uploadsDir, "practice.bin"), "practice");
  wipeUploadsDir("training");
  assert.equal(existsSync(path.join(live.uploadsDir, "live.bin")), true);
  assert.equal(existsSync(path.join(training.uploadsDir, "practice.bin")), false);
});

test("Reset to original is Editor/Approver gated", () => {
  assert.equal(canResetTraining("editor"), true);
  assert.equal(canResetTraining("approver"), true);
  assert.equal(canResetTraining("reviewer"), false);
});
