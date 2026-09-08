import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

function readRepoFile(relativePath: string): string {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("header: Revision + DPRR, G-1 left, Army right, no DRAFT chip; exports stamped", () => {
  const css = readRepoFile("app/globals.css");
  const workbench = readRepoFile("components/Workbench.tsx");
  const guide = readRepoFile("app/guide/page.tsx");
  const marks = readRepoFile("components/HeaderMarks.tsx");
  const editor = readRepoFile("components/EditorPane.tsx");
  const exportDocx = readRepoFile("lib/export-docx.ts");

  assert.equal(existsSync(new URL("../public/g1-seal.png", import.meta.url)), true);
  assert.equal(existsSync(new URL("../public/us-army-logo.png", import.meta.url)), true);
  assert.match(marks, /src="\/g1-seal\.png"/);
  assert.match(marks, /src="\/us-army-logo\.png"/);
  assert.equal(marks.includes("data-army-mark-slot"), false);
  assert.equal(marks.includes("ArmyMarkSlot"), false);
  assert.match(workbench, /<G1Mark \/>/);
  assert.match(workbench, /<ArmyMark \/>/);
  assert.match(guide, /<ArmyMark \/>/);
  assert.match(workbench, /AR 600-85 Revision/);
  assert.match(workbench, /Directorate of Prevention, Resilience and Readiness/);
  assert.equal(workbench.includes("DraftChip"), false);
  assert.equal(guide.includes("DraftChip"), false);
  assert.equal(marks.includes("DraftChip"), false);
  assert.equal(css.includes(".draft-chip"), false);
  assert.equal(css.includes(".draft-banner"), false);
  assert.equal(css.includes("repeating-linear-gradient"), false);
  assert.equal(workbench.includes("Internal G-1 rewrite working group use only"), false);
  assert.equal(workbench.includes("Original regulation (read-only):"), false);
  assert.match(editor, /WORKING COPY/);

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
  const css = readRepoFile("app/globals.css");
  const guidePage = readRepoFile("app/guide/page.tsx");
  assert.match(workbench, />Role</);
  assert.match(workbench, /ROLE_LABEL/);
  assert.match(workbench, /Export Word \(DRAFT\)/);
  assert.match(css, /\.btn-header \{/);
  assert.match(workbench, /label className="btn-header"/);
  const exportWord = workbench.match(/href="\/api\/export"[^>]*className="([^"]+)"/);
  const exportSummary = workbench.match(/href="\/api\/export\?kind=summary"[^>]*className="([^"]+)"/);
  const guide = workbench.match(/href="\/guide"[^>]*className="([^"]+)"/);
  assert.ok(exportWord && exportSummary && guide);
  assert.equal(exportWord[1], exportSummary[1]);
  assert.equal(exportWord[1], guide[1]);
  assert.equal(exportWord[1], "btn-header");
  assert.match(guidePage, /className="btn-header"/);
  assert.equal(workbench.includes("btn-ghost"), false);
});

test("Export Word uses an up-arrow tray icon, not a download chevron", () => {
  const marks = readRepoFile("components/HeaderMarks.tsx");
  assert.match(marks, /V4\.636l2\.955 3\.129/);
  assert.match(marks, /l-4\.25-4\.5/);
  assert.equal(marks.includes("v1h1a1 1 0 110 2h-1v1"), false);
});

test("right pane chrome is labeled Assistant", () => {
  const pane = readRepoFile("components/AssistPane.tsx");
  const workbench = readRepoFile("components/Workbench.tsx");
  assert.match(pane, />ASSISTANT</);
  assert.match(pane, /label="Assistant"/);
  assert.match(pane, /label: "Assistant"/);
  assert.equal(pane.includes("label: \"Assist\""), false);
  assert.match(workbench, /label="Show Assistant"/);
  assert.equal(workbench.includes('label="Show Assist"'), false);
});
