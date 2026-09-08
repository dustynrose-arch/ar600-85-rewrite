import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

function readRepoFile(relativePath: string): string {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("G-1 seal stays; no on-screen DRAFT chrome; exports stay stamped", () => {
  const css = readRepoFile("app/globals.css");
  const workbench = readRepoFile("components/Workbench.tsx");
  const guide = readRepoFile("app/guide/page.tsx");
  const exportDocx = readRepoFile("lib/export-docx.ts");

  assert.match(workbench, /src="\/g1-seal\.png"/);
  assert.match(guide, /src="\/g1-seal\.png"/);
  assert.equal(css.includes("repeating-linear-gradient"), false);
  assert.equal(css.includes(".draft-banner"), false);
  assert.equal(workbench.includes("DraftBanner"), false);
  assert.equal(guide.includes("DraftBanner"), false);
  assert.equal(workbench.includes("DRAFT / WORKING COPY"), false);
  assert.equal(guide.includes("DRAFT / WORKING COPY"), false);

  assert.match(exportDocx, /DRAFT \/ WORKING COPY/);
  assert.match(exportDocx, /draftRun\("DRAFT"/);
  assert.match(readRepoFile("app/api/export/route.ts"), /X-Draft-Stamp/);
});

test("LOCKED banner appears only for the idle lock, with clay/brass Unlock — not destructive rust", () => {
  const css = readRepoFile("app/globals.css");
  const workbench = readRepoFile("components/Workbench.tsx");

  assert.match(workbench, /state\.locked \?/);
  assert.match(workbench, /lock-banner/);
  assert.match(workbench, /LOCKED/);
  assert.match(workbench, /Session locked after idle\. Working copy saved\. Baseline untouched\./);
  assert.match(workbench, />\s*Unlock\s*</);
  assert.match(workbench, /className="btn-primary shrink-0"/);

  assert.match(css, /--g1-lock-bg:\s*#f0e2dc/);
  assert.match(css, /--g1-lock-text:\s*#5a3228/);
  assert.match(css, /\.lock-banner \{[\s\S]*var\(--g1-lock-text\)/);
  assert.equal(css.includes("inset 4px 0 0 #8b2e1f"), false);
  assert.equal(css.includes("repeating-linear-gradient"), false);
});

test("button utilities are rounded rectangles, not pills or sharp corners", () => {
  const css = readRepoFile("app/globals.css");
  assert.match(css, /\.btn \{[\s\S]*rounded-lg/);
  assert.match(css, /\.btn-primary \{[\s\S]*rounded-xl/);
  assert.match(css, /0 1px 2px rgba\(0, 0, 0, 0\.08\)/);
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
