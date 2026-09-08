import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

function readRepoFile(relativePath: string): string {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("UI has no on-screen DRAFT / WORKING COPY chrome; exports stay stamped", () => {
  const css = readRepoFile("app/globals.css");
  const workbench = readRepoFile("components/Workbench.tsx");
  const guide = readRepoFile("app/guide/page.tsx");
  const outline = readRepoFile("components/OutlinePane.tsx");
  const exportDocx = readRepoFile("lib/export-docx.ts");

  assert.equal(css.includes("repeating-linear-gradient"), false);
  assert.equal(css.includes(".draft-banner"), false);
  assert.equal(workbench.includes("DraftBanner"), false);
  assert.equal(guide.includes("DraftBanner"), false);
  assert.equal(workbench.includes("DRAFT / WORKING COPY"), false);
  assert.equal(guide.includes("DRAFT / WORKING COPY"), false);
  assert.equal(/font-bold">DRAFT</.test(outline), false);

  assert.match(exportDocx, /DRAFT \/ WORKING COPY/);
  assert.match(exportDocx, /draftRun\("DRAFT"/);
  assert.match(readRepoFile("app/api/export/route.ts"), /X-Draft-Stamp/);
});

test("LOCKED banner appears only for the idle lock, with a solid Unlock control", () => {
  const workbench = readRepoFile("components/Workbench.tsx");
  assert.match(workbench, /state\.locked \?/);
  assert.match(workbench, /lock-banner/);
  assert.match(workbench, /LOCKED/);
  assert.match(workbench, />\s*Unlock\s*</);
  assert.match(workbench, /Working copy saved\. Baseline untouched/);
});

test("button utilities are rounded rectangles, not pills or sharp corners", () => {
  const css = readRepoFile("app/globals.css");
  assert.match(css, /\.btn \{[\s\S]*rounded-lg/);
  assert.match(css, /\.btn-primary \{[\s\S]*rounded-xl/);
  assert.equal(/\.btn[^{]*\{[^}]*rounded-full/.test(css), false);
  assert.match(css, /outline: 2px solid var\(--g1-brass\)/);
});

test("header Word export matches neighboring header buttons; Role stays labeled", () => {
  const workbench = readRepoFile("components/Workbench.tsx");
  assert.match(workbench, />Role</);
  assert.match(workbench, /ROLE_LABEL/);
  assert.match(workbench, /Export Word \(DRAFT\)/);
  const exportWord = workbench.match(/href="\/api\/export"[^>]*className="([^"]+)"/);
  const exportSummary = workbench.match(/href="\/api\/export\?kind=summary"[^>]*className="([^"]+)"/);
  const guide = workbench.match(/href="\/guide"[^>]*className="([^"]+)"/);
  assert.ok(exportWord && exportSummary && guide);
  assert.equal(exportWord[1], exportSummary[1]);
  assert.equal(exportWord[1], guide[1]);
  assert.match(exportWord[1], /btn-ghost/);
});
