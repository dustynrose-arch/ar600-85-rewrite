import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runtimeEnv } from "./runtime-env.ts";

test("runtimeEnv trims at request time and treats missing keys as empty", () => {
  const previous = process.env.WG_ACCESS_SECRET;
  try {
    process.env.WG_ACCESS_SECRET = "  hobby-secret  ";
    assert.equal(runtimeEnv("WG_ACCESS_SECRET"), "hobby-secret");
    delete process.env.WG_ACCESS_SECRET;
    assert.equal(runtimeEnv("WG_ACCESS_SECRET"), "");
  } finally {
    if (previous == null) delete process.env.WG_ACCESS_SECRET;
    else process.env.WG_ACCESS_SECRET = previous;
  }
});

test("runtime-env lists static process.env keys so Next.js embeds them", () => {
  const source = readFileSync(new URL("./runtime-env.ts", import.meta.url), "utf8");
  for (const name of [
    "WG_ACCESS_SECRET",
    "BLOB_READ_WRITE_TOKEN",
    "BLOB_STORE_ID",
    "VERCEL_OIDC_TOKEN",
  ]) {
    assert.match(source, new RegExp(`process\\.env\\.${name}`));
  }
  assert.match(source, /process\.env as Record/);
  assert.match(source, /knownRuntimeEnv/);
  assert.equal(source.includes("const WG_ACCESS_SECRET = process.env.WG_ACCESS_SECRET"), false);
});
