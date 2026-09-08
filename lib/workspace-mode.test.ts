import assert from "node:assert/strict";
import { test } from "node:test";
import {
  modeFromCookieHeader,
  parseWorkspaceMode,
  WORKSPACE_MODE_COOKIE,
} from "./workspace-mode.ts";

test("parseWorkspaceMode treats only training as training", () => {
  assert.equal(parseWorkspaceMode("training"), "training");
  assert.equal(parseWorkspaceMode("live"), "live");
  assert.equal(parseWorkspaceMode(undefined), "live");
  assert.equal(parseWorkspaceMode("TRAINING"), "live");
});

test("modeFromCookieHeader reads the workspace cookie and defaults to live", () => {
  assert.equal(modeFromCookieHeader(null), "live");
  assert.equal(modeFromCookieHeader(`${WORKSPACE_MODE_COOKIE}=training`), "training");
  assert.equal(
    modeFromCookieHeader(`other=1; ${WORKSPACE_MODE_COOKIE}=training; theme=gold`),
    "training",
  );
  assert.equal(modeFromCookieHeader(`${WORKSPACE_MODE_COOKIE}=live`), "live");
});
