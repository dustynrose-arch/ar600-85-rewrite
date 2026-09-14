import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

function readRepoFile(relativePath: string): string {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("gold DRAFT / WORKING COPY and Training TRAINING banners stay non-strippable", () => {
  const banner = readRepoFile("components/DraftBanner.tsx");
  const training = readRepoFile("components/TrainingBanner.tsx");
  const workbench = readRepoFile("components/Workbench.tsx");
  const guide = readRepoFile("app/guide/page.tsx");
  const exportStamps = readRepoFile("lib/export-stamps.ts");
  const css = readRepoFile("app/globals.css");

  assert.match(banner, /DRAFT \/ WORKING COPY/);
  assert.match(banner, /draft-banner/);
  assert.match(css, /\.draft-banner/);
  assert.match(css, /repeating-linear-gradient/);
  assert.match(training, />TRAINING</);
  assert.match(training, /training-banner/);
  assert.match(workbench, /<DraftBanner \/>/);
  assert.match(workbench, /<TrainingBanner \/>/);
  assert.match(guide, /<DraftBanner \/>/);
  assert.match(guide, /<TrainingBanner \/>/);
  assert.match(exportStamps, /TRAINING \/ DRAFT \/ WORKING COPY/);
  assert.match(exportStamps, /DRAFT \/ WORKING COPY/);
  assert.match(exportStamps, /TRAINING \/ DRAFT/);
});

test("header: dual seals flank title, DPRR subtitle, Working Copy dropped from title", () => {
  const brand = readRepoFile("components/HeaderBrand.tsx");
  const workbench = readRepoFile("components/Workbench.tsx");
  const guide = readRepoFile("app/guide/page.tsx");
  const layout = readRepoFile("app/layout.tsx");

  assert.equal(existsSync(new URL("../public/g1-seal.png", import.meta.url)), true);
  assert.equal(existsSync(new URL("../public/army-seal.png", import.meta.url)), true);
  assert.match(brand, /src="\/g1-seal\.png"/);
  assert.match(brand, /src="\/army-seal\.png"/);
  assert.match(brand, /AR 600-85 Rewrite/);
  assert.match(brand, /Directorate of Prevention, Resilience and Readiness/);
  assert.match(brand, /Never seals alone/);
  assert.equal(brand.includes("— Working Copy"), false);
  assert.equal(workbench.includes("Internal G-1 rewrite working group use only"), false);
  assert.equal(workbench.includes("Original regulation (read-only):"), false);
  assert.equal(guide.includes("Internal G-1 rewrite working group use only"), false);
  assert.match(workbench, /<HeaderBrand/);
  assert.match(guide, /<HeaderBrand/);
  assert.match(layout, /title: training \? "TRAINING — AR 600-85 Rewrite" : "AR 600-85 Rewrite"/);
  assert.match(layout, /Directorate of Prevention, Resilience and Readiness/);
});

test("editable-draft chrome says Your draft; legal banner still says WORKING COPY", () => {
  const editor = readRepoFile("components/EditorPane.tsx");
  const draft = readRepoFile("components/DraftEditor.tsx");
  const banner = readRepoFile("components/DraftBanner.tsx");
  const assist = readRepoFile("components/AssistPane.tsx");

  assert.match(editor, />Your draft</);
  assert.equal(editor.includes("WORKING COPY"), false);
  assert.match(draft, />Your draft</);
  assert.match(assist, /Compare your draft against/);
  assert.match(banner, /DRAFT \/ WORKING COPY/);
});

test("rounded-rectangle buttons share one radius; Training gold fill and Reset Cancel contrast stay", () => {
  const css = readRepoFile("app/globals.css");
  const trainingSwitch = readRepoFile("components/TrainingSwitch.tsx");

  assert.match(css, /\.btn \{[\s\S]*rounded-lg/);
  assert.match(css, /\.btn-header \{/);
  assert.equal(/\.btn[^{]*\{[^}]*rounded-full/.test(css), false);

  const leaveIdx = trainingSwitch.indexOf("Leave Training");
  const leaveBlock = trainingSwitch.slice(Math.max(0, leaveIdx - 400), leaveIdx);
  assert.match(leaveBlock, /rounded-lg/);
  assert.match(leaveBlock, /bg-army-gold/);
  assert.match(leaveBlock, /text-army-black/);
  assert.match(leaveBlock, /border-army-cream/);

  const enterIdx = trainingSwitch.indexOf("Enter Training");
  const enterBlock = trainingSwitch.slice(Math.max(0, enterIdx - 200), enterIdx);
  assert.match(enterBlock, /rounded-lg/);
  assert.match(enterBlock, /bg-army-gold/);

  const confirmBlock = trainingSwitch.slice(trainingSwitch.indexOf("CONFIRM RESET"));
  assert.match(confirmBlock, /rounded-lg/);
  assert.match(confirmBlock, /bg-army-ink text-army-cream/);
  assert.match(confirmBlock, /border-2 border-army-black/);
  assert.match(confirmBlock, /bg-army-rust text-white/);
});

test("panel headings share font-ui; parent class is larger than child class", () => {
  const css = readRepoFile("app/globals.css");
  const outline = readRepoFile("components/OutlinePane.tsx");
  const editor = readRepoFile("components/EditorPane.tsx");
  const assist = readRepoFile("components/AssistPane.tsx");
  const summary = readRepoFile("components/SummaryOfChangePane.tsx");

  assert.match(css, /\.panel-heading \{[\s\S]*font-ui[\s\S]*text-sm/);
  assert.match(css, /\.section-heading \{[\s\S]*font-ui[\s\S]*text-\[11px\]/);
  assert.match(css, /\.chapter-heading \{[\s\S]*font-ui[\s\S]*text-\[13px\]/);
  assert.match(outline, /className="panel-heading">Outline</);
  assert.match(outline, /chapter-heading/);
  assert.match(editor, /className="panel-heading">Your draft</);
  assert.match(assist, /className="panel-heading">Assist</);
  assert.match(summary, /className="panel-heading">Summary of Change</);
});

test("STEER AR sister-pub chips are buttons with cursor, underline, and focus ring", () => {
  const css = readRepoFile("app/globals.css");
  const assist = readRepoFile("components/AssistPane.tsx");

  assert.match(css, /\.steer-ar \{[\s\S]*cursor-pointer/);
  assert.match(css, /\.steer-ar \{[\s\S]*underline/);
  assert.match(css, /button:focus-visible/);
  assert.match(assist, /data-steer-ar=""/);
  assert.match(assist, /className="steer-ar"/);
  assert.match(assist, /STEER \{pub\}/);
  assert.match(assist, /onOpenAuthority/);
  assert.match(assist, /className="assist-link mt-1"/);
});

test("Assist glossary heading is plain language, not GLOSSARY TIP — LOCKED TERMS", () => {
  const assist = readRepoFile("components/AssistPane.tsx");
  const guide = readRepoFile("components/UserGuide.tsx");

  assert.match(assist, /Glossary — terms you must keep/);
  assert.equal(assist.includes("GLOSSARY TIP — LOCKED TERMS"), false);
  assert.equal(assist.includes("Cheech"), false);
  assert.match(guide, /Glossary — terms you must keep/);
});
