import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

function readRepoFile(relativePath: string): string {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("header DRAFT chip is always on; gold DRAFT / WORKING COPY bar is gone; export stamps stay", () => {
  const brand = readRepoFile("components/HeaderBrand.tsx");
  const training = readRepoFile("components/TrainingBanner.tsx");
  const workbench = readRepoFile("components/Workbench.tsx");
  const guide = readRepoFile("app/guide/page.tsx");
  const exportStamps = readRepoFile("lib/export-stamps.ts");
  const exportDocx = readRepoFile("lib/export-docx.ts");
  const css = readRepoFile("app/globals.css");

  assert.equal(existsSync(new URL("../components/DraftBanner.tsx", import.meta.url)), false);
  assert.equal(workbench.includes("DraftBanner"), false);
  assert.equal(guide.includes("DraftBanner"), false);
  assert.equal(css.includes("draft-banner"), false);
  assert.equal(css.includes("repeating-linear-gradient"), false);

  assert.match(brand, /headerDraftMark/);
  assert.match(brand, /TRAINING \/ DRAFT/);
  assert.match(brand, /data-draft-mark=""/);
  assert.match(brand, /className="header-draft-mark"/);
  assert.match(brand, /Never seals alone/);
  assert.equal(brand.includes("Hide"), false);
  assert.equal(brand.includes("<button"), false);
  assert.match(css, /\.header-draft-mark \{/);

  assert.match(workbench, /<HeaderBrand title=\{HEADER_TITLE\} training=\{state\.mode === "training"\} \/>/);
  assert.match(guide, /training=\{mode === "training"\}/);
  assert.match(workbench, /<TrainingBanner \/>/);
  assert.match(guide, /<TrainingBanner \/>/);
  assert.match(training, />TRAINING</);
  assert.match(training, /training-banner/);

  assert.match(exportStamps, /TRAINING \/ DRAFT \/ WORKING COPY/);
  assert.match(exportStamps, /DRAFT \/ WORKING COPY/);
  assert.match(exportStamps, /TRAINING \/ DRAFT/);
  assert.match(exportDocx, /draftRun\(wordHeaderMark\(training\)/);
  assert.match(exportDocx, /draftRun\(wordFooterMark\(training\)/);
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

test("editable-draft chrome says Your draft; on-screen mark is the header DRAFT chip", () => {
  const editor = readRepoFile("components/EditorPane.tsx");
  const draft = readRepoFile("components/DraftEditor.tsx");
  const brand = readRepoFile("components/HeaderBrand.tsx");
  const assist = readRepoFile("components/AssistPane.tsx");
  const userGuide = readRepoFile("components/UserGuide.tsx");
  const walkthrough = readRepoFile("components/GuideWalkthrough.tsx");

  assert.match(editor, />Your draft</);
  assert.equal(editor.includes("WORKING COPY"), false);
  assert.match(draft, />Your draft</);
  assert.match(assist, /Compare your draft against/);
  assert.match(brand, /headerDraftMark\(training\)/);
  assert.match(brand, /"DRAFT"/);
  assert.equal(brand.includes("WORKING COPY"), false);
  assert.match(userGuide, /DRAFT<\/strong> chip/);
  assert.equal(userGuide.includes("gold-and-black"), false);
  assert.match(walkthrough, /DRAFT<\/strong> chip in the header/);
  assert.equal(walkthrough.includes("gold banner"), false);
  assert.equal(walkthrough.includes("DRAFT / WORKING COPY banner"), false);
});

test("Your draft editor uses a modest extra share of the center pane", () => {
  const editor = readRepoFile("components/EditorPane.tsx");
  const draft = readRepoFile("components/DraftEditor.tsx");
  const workbench = readRepoFile("components/Workbench.tsx");

  assert.match(editor, /grid-rows-\[minmax\(0,2fr\)_minmax\(14rem,3fr\)\]/);
  assert.equal(editor.includes("grid-rows-2"), false);
  assert.match(draft, /flex-1 min-h-0 m-2 /);
  assert.match(workbench, /w-\[320px\]/);
  assert.match(workbench, /w-\[340px\]/);
  assert.match(workbench, /CollapsedRail/);
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
