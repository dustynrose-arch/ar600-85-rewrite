import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runtimeEnv } from "./runtime-env.ts";

test("runtimeEnv reads bracket process.env so Next.js cannot inline an empty secret", () => {
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
  const source = readFileSync(new URL("./runtime-env.ts", import.meta.url), "utf8");
  assert.match(source, /process\.env as Record/);
  assert.equal(source.includes("process.env.WG_ACCESS_SECRET"), false);
});
