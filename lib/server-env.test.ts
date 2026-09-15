import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { nodeIsolateEnv } from "./node-env.ts";
import { serverEnv } from "./server-env.ts";

test("nodeIsolateEnv and serverEnv read the Node isolate at request time", () => {
  const previous = process.env.WG_ACCESS_SECRET;
  try {
    process.env.WG_ACCESS_SECRET = "  isolate-secret  ";
    assert.equal(nodeIsolateEnv("WG_ACCESS_SECRET"), "isolate-secret");
    assert.equal(serverEnv("WG_ACCESS_SECRET"), "isolate-secret");
    delete process.env.WG_ACCESS_SECRET;
    assert.equal(nodeIsolateEnv("WG_ACCESS_SECRET"), "");
    assert.equal(serverEnv("WG_ACCESS_SECRET"), "");
  } finally {
    if (previous == null) delete process.env.WG_ACCESS_SECRET;
    else process.env.WG_ACCESS_SECRET = previous;
  }
});

test("Node isolate helper is not imported by Edge middleware", () => {
  const middleware = readFileSync(new URL("../middleware.ts", import.meta.url), "utf8");
  const nodeEnv = readFileSync(new URL("./node-env.ts", import.meta.url), "utf8");
  assert.match(nodeEnv, /from "node:process"/);
  assert.equal(middleware.includes("node-env"), false);
  assert.equal(middleware.includes("server-env"), false);
});
