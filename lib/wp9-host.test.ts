import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

function readRepoFile(relativePath: string): string {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("WP9 host files keep Secure cookies, isolated stores, and a non-official access gate", () => {
  const workspaceMode = readRepoFile("lib/workspace-mode.ts");
  const cookieOptions = readRepoFile("lib/cookie-options.ts");
  const persist = readRepoFile("lib/persist.ts");
  const store = readRepoFile("lib/store.ts");
  const accessPage = readRepoFile("app/access/page.tsx");
  const accessForm = readRepoFile("components/WgAccessForm.tsx");
  const middleware = readRepoFile("middleware.ts");
  const envExample = readRepoFile(".env.example");
  const readme = readRepoFile("README.md");
  const vercel = readRepoFile("vercel.json");
  const brand = readRepoFile("components/HeaderBrand.tsx");
  const stamps = readRepoFile("lib/export-stamps.ts");
  const uploadGuard = readRepoFile("lib/upload-guard.ts");
  const roles = readRepoFile("lib/roles.ts");

  assert.match(cookieOptions, /sameSite: "lax"/);
  assert.match(cookieOptions, /secure: cookieSecureFromRequest/);
  assert.match(workspaceMode, /sessionCookieOptions\(request\)/);
  assert.match(persist, /ar60085\/\$\{mode\}\/workspace\.json/);
  assert.match(persist, /ar60085\/\$\{mode\}\/uploads\//);
  assert.match(persist, /VERCEL_REQUIRES_BLOB/);
  assert.match(persist, /useCache: false/);
  assert.match(store, /withWorkspaceLock/);
  assert.match(store, /storage: persistKind\(\) === "blob"/);
  assert.match(store, /Always read the durable backend/);

  assert.match(accessPage, /HeaderBrand/);
  assert.match(accessPage, /NOT AN OFFICIAL ARMY SYSTEM/);
  assert.match(accessPage, /not<\/strong> an authenticated Army publication/);
  assert.equal(accessPage.toLowerCase().includes("cac"), false);
  assert.equal(accessForm.toLowerCase().includes("sign in with"), false);
  assert.match(middleware, /WG_ACCESS_COOKIE/);
  assert.match(middleware, /\/access/);

  assert.match(envExample, /BLOB_READ_WRITE_TOKEN=/);
  assert.match(envExample, /KV_REST_API_URL=/);
  assert.match(envExample, /WG_ACCESS_SECRET=/);
  assert.match(readme, /## WP9 Shared host/);
  assert.match(readme, /Deploy plan \(Web Guard\)/);
  assert.match(readme, /non-negotiable/);
  assert.match(readme, /Password Protection/);
  assert.match(readme, /BLOB_READ_WRITE_TOKEN/);
  assert.match(vercel, /"framework": "nextjs"/);

  assert.match(brand, /headerDraftMark/);
  assert.match(brand, /Never seals alone/);
  assert.match(stamps, /DRAFT \/ WORKING COPY/);
  assert.match(uploadGuard, /\.docx/);
  assert.match(roles, /canUpload/);
  assert.match(roles, /canResetTraining/);
});
