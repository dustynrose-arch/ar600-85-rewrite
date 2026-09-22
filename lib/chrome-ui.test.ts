import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

function readRepoFile(relativePath: string): string {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("header DRAFT mark is always on; gold DRAFT / WORKING COPY bar is gone; export stamps stay", () => {
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
  assert.equal(brand.includes("btn-header"), false, "DRAFT / TRAINING / DRAFT stay marks, not action buttons");
  assert.equal(brand.includes("<button"), false);
  assert.match(css, /\.header-draft-mark \{/);

  assert.match(workbench, /<HeaderBrand title=\{HEADER_TITLE\} training=\{state\.mode === "training"\} \/>/);
  assert.match(guide, /training=\{mode === "training"\}/);
  assert.match(workbench, /<TrainingBanner \/>/);
  assert.match(workbench, /state\.mode === "training" \? <TrainingBanner/);
  assert.match(guide, /<TrainingBanner \/>/);
  assert.match(training, />TRAINING</);
  assert.match(training, /training-banner/);

  assert.match(exportStamps, /TRAINING \/ DRAFT \/ WORKING COPY/);
  assert.match(exportStamps, /DRAFT \/ WORKING COPY/);
  assert.match(exportStamps, /TRAINING \/ DRAFT/);
  assert.match(exportDocx, /draftRun\(wordHeaderMark\(training\)/);
  assert.match(exportDocx, /draftRun\(wordFooterMark\(training\)/);
});

test("header: G-1 then Army seal, title + DPRR, DRAFT mark, Working Copy dropped from title", () => {
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

test("editable-draft chrome says Your draft; on-screen mark is the header DRAFT text", () => {
  const editor = readRepoFile("components/EditorPane.tsx");
  const draft = readRepoFile("components/DraftEditor.tsx");
  const brand = readRepoFile("components/HeaderBrand.tsx");
  const assist = readRepoFile("components/AssistPane.tsx");
  const userGuide = readRepoFile("components/UserGuide.tsx");
  const guideCopy = readRepoFile("content/user-guide.md");
  const walkthrough = readRepoFile("components/GuideWalkthrough.tsx");

  assert.match(editor, />Your draft</);
  assert.equal(editor.includes("WORKING COPY"), false);
  assert.match(draft, />Your draft</);
  assert.match(assist, /Compare your draft against/);
  assert.match(brand, /headerDraftMark\(training\)/);
  assert.match(brand, /"DRAFT"/);
  assert.match(brand, /"TRAINING \/ DRAFT"/);
  assert.equal(brand.includes("WORKING COPY"), false);
  assert.match(guideCopy, /\*\*DRAFT\*\* mark/);
  assert.match(guideCopy, /TRAINING \/ DRAFT/);
  assert.equal(userGuide.includes("gold-and-black"), false);
  assert.equal(guideCopy.includes("gold-and-black"), false);
  assert.match(walkthrough, /DRAFT<\/strong> mark/);
  assert.match(walkthrough, /in the header/);
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
  assert.match(leaveBlock, /btn-header/);
  assert.equal(leaveBlock.includes("bg-army-cream"), false, "Cream fill on the dark header is too pale");

  const enterIdx = trainingSwitch.indexOf("Enter Training");
  const enterBlock = trainingSwitch.slice(Math.max(0, enterIdx - 200), enterIdx);
  assert.match(enterBlock, /btn-header/);

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
  assert.match(assist, /className="panel-heading">Writing Assistant</);
  assert.match(summary, /className="panel-heading">Summary of Change</);
});

test("right pane chrome is Writing Assistant, not Assist", () => {
  const assist = readRepoFile("components/AssistPane.tsx");
  const workbench = readRepoFile("components/Workbench.tsx");
  const guide = readRepoFile("components/UserGuide.tsx");
  const guideCopy = readRepoFile("content/user-guide.md");
  const walkthrough = readRepoFile("components/GuideWalkthrough.tsx");

  assert.match(assist, /className="panel-heading">Writing Assistant</);
  assert.match(assist, /label: "Writing Assistant"/);
  assert.match(assist, /PaneToggle label="Writing Assistant"/);
  assert.match(workbench, /Show Writing Assistant/);
  assert.equal(assist.includes('panel-heading">Assist<'), false);
  assert.equal(workbench.includes("Show Assist"), false);
  assert.equal(guide.includes("Hide Assist"), false);
  assert.equal(guideCopy.includes("Hide Assist"), false);
  assert.equal(walkthrough.includes("Hide Assist"), false);
  assert.match(guideCopy, /Writing Assistant\*\* on the right/);
  assert.match(guideCopy, /Open the \*\*Writing Assistant\*\* tab/);
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
  const guideCopy = readRepoFile("content/user-guide.md");

  assert.match(assist, /Glossary — terms you must keep/);
  assert.equal(assist.includes("GLOSSARY TIP — LOCKED TERMS"), false);
  assert.equal(assist.includes("Cheech"), false);
  assert.match(guideCopy, /Glossary — terms you must keep/);
});

test("darker-but-fun chrome: dark scheme, plain gold DRAFT mark, no leftover light panes, export stamps untouched", () => {
  const css = readRepoFile("app/globals.css");
  const tailwind = readRepoFile("tailwind.config.ts");
  const outline = readRepoFile("components/OutlinePane.tsx");
  const assist = readRepoFile("components/AssistPane.tsx");
  const workbench = readRepoFile("components/Workbench.tsx");
  const brand = readRepoFile("components/HeaderBrand.tsx");
  const draft = readRepoFile("components/DraftEditor.tsx");
  const editor = readRepoFile("components/EditorPane.tsx");
  const paneToggle = readRepoFile("components/PaneToggle.tsx");
  const training = readRepoFile("components/TrainingBanner.tsx");
  const trainingSwitch = readRepoFile("components/TrainingSwitch.tsx");
  const exportStamps = readRepoFile("lib/export-stamps.ts");
  const exportDocx = readRepoFile("lib/export-docx.ts");

  assert.match(css, /color-scheme:\s*dark/);
  assert.match(css, /bg-army-black text-army-cream/);
  assert.match(css, /\.header-draft-mark \{[\s\S]*text-army-gold/);
  assert.match(css, /\.header-draft-mark \{[\s\S]*background:\s*none/);
  assert.match(css, /\.header-draft-mark \{[\s\S]*border:\s*0/);
  assert.match(css, /\.header-draft-mark \{[\s\S]*box-shadow:\s*none/);
  assert.equal(
    /\.header-draft-mark \{[^}]*bg-army-gold/.test(css),
    false,
    "DRAFT / TRAINING / DRAFT must be plain text, not a filled chip",
  );
  assert.equal(/\.header-draft-mark \{[^}]*rounded-lg/.test(css), false);
  assert.equal(/\.header-draft-mark \{[^}]*shadow-chip/.test(css), false);
  assert.match(css, /\.draft-misspelled \{[\s\S]*#ff6b6b/);
  assert.match(css, /caret-color: #f4efe3/);
  assert.equal(css.includes("color-scheme: light"), false);
  assert.equal(css.includes("bg-white"), false);

  assert.match(tailwind, /raised:\s*"#262a38"/);
  assert.match(tailwind, /gold:\s*"#e2b84a"/);

  assert.equal(outline.includes("#efe8d8"), false);
  assert.equal(assist.includes("#f7f2e6"), false);
  assert.equal(paneToggle.includes("#efe8d8"), false);
  assert.equal(workbench.includes("bg-army-cream"), false);
  assert.match(workbench, /bg-army-black/);
  assert.match(outline, /panel-surface/);
  assert.match(assist, /panel-surface/);
  assert.match(editor, /panel-surface/);
  assert.match(draft, /bg-army-ink/);
  assert.equal(draft.includes("bg-white"), false);
  assert.equal(assist.includes("bg-white"), false);
  assert.equal(outline.includes("bg-white"), false);

  assert.equal(brand.includes("ring-"), false, "Army seal must not sit in a decorative ring/box");
  assert.match(brand, /header-brand/);
  assert.match(brand, /header-brand-titles/);
  assert.match(css, /\.header-brand \{[\s\S]*flex-nowrap[\s\S]*shrink-0/);
  assert.match(css, /\.header-brand-titles \{[\s\S]*whitespace-nowrap/);
  assert.equal(brand.includes("flex-1"), false, "flex-1 squeezed the title into a stacked column between the seals");
  assert.equal(brand.includes("max-w-[28rem]"), false, "title and DPRR subtitle must sit on one horizontal row");
  assert.equal(brand.includes("min-w-0"), false);
  assert.match(brand, /src="\/g1-seal\.png"/);
  assert.match(brand, /src="\/army-seal\.png"/);
  assert.match(brand, /className="header-draft-mark"/);

  assert.match(training, /training-banner/);
  assert.match(trainingSwitch, /btn-header/);
  assert.match(exportDocx, /draftRun\(wordHeaderMark\(training\)/);
  assert.match(exportDocx, /draftRun\(wordFooterMark\(training\)/);
});

test("top-bar chrome: one row G-1 Army title DPRR DRAFT then gold actions; wrap instead of scroll", () => {
  const css = readRepoFile("app/globals.css");
  const workbench = readRepoFile("components/Workbench.tsx");
  const guide = readRepoFile("app/guide/page.tsx");
  const brand = readRepoFile("components/HeaderBrand.tsx");
  const trainingSwitch = readRepoFile("components/TrainingSwitch.tsx");
  const exportStamps = readRepoFile("lib/export-stamps.ts");

  assert.match(css, /\.btn-header \{[\s\S]*bg-army-gold[\s\S]*text-army-black[\s\S]*border-army-gold/);
  assert.match(css, /\.btn-header-ghost \{[\s\S]*btn-header/);
  assert.match(css, /\.btn-header \{[\s\S]*h-7/);
  assert.match(css, /\.header-bar \{[\s\S]*flex-wrap[\s\S]*gap-1\.5/);
  assert.match(css, /\.header-actions \{[\s\S]*ml-auto[\s\S]*justify-end[\s\S]*gap-1\.5/);
  assert.match(css, /\.header-role-value \{[\s\S]*bg-army-black[\s\S]*text-army-cream/);
  assert.match(css, /\.header-export-group \{[\s\S]*gap-1/);
  assert.equal(css.includes("btn-header-export"), false);
  assert.equal(/\.header-export-group \{[^}]*bg-army-olive/.test(css), false, "export group stays gold, not an olive cluster");

  const headerStart = workbench.indexOf("<header");
  const headerEnd = workbench.indexOf("</header>");
  const header = workbench.slice(headerStart, headerEnd);
  const brandIdx = header.indexOf("<HeaderBrand");
  const actionsIdx = header.indexOf("header-actions");
  assert.ok(brandIdx >= 0 && actionsIdx > brandIdx, "seals + title/DPRR sit left of top-bar actions");
  assert.match(header, /header-bar/);
  assert.match(header, /className="header-actions"/);
  assert.equal(header.includes("overflow-x-auto"), false, "horizontal scroll hid seals/mark");
  assert.equal(header.includes("justify-between"), false, "justify-between interleaved wrapped actions to the left");
  const roleIdx = header.indexOf("header-role");
  const trainingIdx = header.indexOf("<TrainingSwitch");
  const exportIdx = header.indexOf("header-export-group");
  const guideBtnIdx = header.indexOf("User Guide");
  const logoutIdx = header.indexOf("<LogOutButton");
  assert.ok(
    roleIdx >= 0 && trainingIdx > roleIdx && exportIdx > trainingIdx && guideBtnIdx > exportIdx && logoutIdx > guideBtnIdx,
    "locked action order: Role, Training, export group, User Guide, Log out",
  );
  assert.match(header, /className="header-role"/);
  assert.match(header, /className="header-role-value"/);
  assert.match(header, /className="header-role-select"/);
  assert.match(header, /Export Word \(Plain\)/);
  assert.match(header, /Export Word \(Track Changes\)/);
  assert.match(header, /Export Summary \(DRAFT\)/);
  assert.match(header, />\s*Plain\s*</);
  assert.match(header, />\s*Track Changes\s*</);
  assert.match(header, />\s*Summary\s*</);
  assert.match(header, /User Guide/);
  assert.match(header, /header-export-group/);
  assert.equal(header.includes("btn-header-export"), false);

  const goldButtons = [...header.matchAll(/className="btn-header"/g)];
  assert.equal(goldButtons.length, 4, "exports + User Guide all use the gold btn-header scheme");
  assert.match(header, /className="header-role"/);

  const guideHeaderStart = guide.indexOf("<header");
  const guideHeader = guide.slice(guideHeaderStart, guide.indexOf("</header>"));
  assert.match(guideHeader, /header-bar/);
  assert.match(guideHeader, /header-actions/);
  assert.match(guideHeader, /<LogOutButton/);
  assert.equal(guideHeader.includes("overflow-x-auto"), false);
  assert.match(guide, /className="btn-header"/);
  assert.equal(guide.includes("btn-header-ghost"), false);

  const logout = readRepoFile("components/LogOutButton.tsx");
  assert.match(logout, /className="btn-header"/);
  assert.match(logout, />\s*Log out\s*</);
  assert.match(logout, /method: "DELETE"/);
  assert.match(logout, /\/api\/access/);
  assert.match(logout, /window\.location\.assign\("\/access"\)/);
  assert.equal(logout.includes("localStorage"), false);
  assert.equal(logout.includes("sessionStorage"), false);

  const leaveIdx = trainingSwitch.indexOf("Leave Training");
  const leaveBlock = trainingSwitch.slice(Math.max(0, leaveIdx - 250), leaveIdx);
  assert.match(leaveBlock, /btn-header/);
  const enterIdx = trainingSwitch.indexOf("Enter Training");
  const enterBlock = trainingSwitch.slice(Math.max(0, enterIdx - 250), enterIdx);
  assert.match(enterBlock, /btn-header/);
  const resetIdx = trainingSwitch.indexOf("Reset to original");
  const resetBlock = trainingSwitch.slice(Math.max(0, resetIdx - 250), resetIdx);
  assert.match(resetBlock, /btn-header/);
  assert.equal(trainingSwitch.includes("border-2 border-army-gold"), false, "Training cluster must not puff the black bar");
  assert.equal(trainingSwitch.includes("flex-wrap items-center gap-2 border-2"), false);

  const armyIdx = brand.indexOf("army-seal.png");
  const armyTag = brand.slice(armyIdx, brand.indexOf("/>", armyIdx) + 2);
  assert.equal(armyTag.includes("ring-"), false);
  assert.equal(armyTag.includes("border"), false);
  assert.equal(armyTag.includes("bg-army-cream"), false);
  assert.equal(armyTag.includes("shadow"), false);
  assert.match(armyTag, /header-seal-army/);
  assert.match(css, /\.header-seal \{[\s\S]*object-contain/);

  const g1Idx = brand.indexOf("g1-seal.png");
  const g1Tag = brand.slice(g1Idx, brand.indexOf("/>", g1Idx) + 2);
  assert.equal(g1Tag.includes("ring-"), false);
  assert.equal(g1Tag.includes("bg-army-cream"), false);
  const titlesIdx = brand.indexOf("header-brand-titles");
  const markIdx = brand.indexOf("header-draft-mark");
  assert.ok(g1Idx >= 0 && armyIdx > g1Idx && titlesIdx > armyIdx && markIdx > titlesIdx, "G-1, Army, title/DPRR, then DRAFT — never seals alone");
  assert.match(brand, /className="header-draft-mark"/);
  assert.equal(brand.includes("btn-header"), false);
  assert.match(brand, /header-brand-titles/);
  assert.match(css, /\.header-brand-titles \{[\s\S]*whitespace-nowrap/);
  assert.equal(brand.includes("flex-1"), false);
  assert.match(brand, /src="\/g1-seal\.png"/);
  assert.match(brand, /src="\/army-seal\.png"/);
  assert.match(brand, /never overflow-x scroll/);
  assert.match(brand, /return training \? "TRAINING \/ DRAFT" : "DRAFT"/);
  assert.equal(brand.includes("TRAINING·DRAFT"), false, "on-screen mark is TRAINING / DRAFT; Word stamps stay slash");

  assert.match(exportStamps, /TRAINING \/ DRAFT \/ WORKING COPY/);
  assert.match(exportStamps, /TRAINING \/ DRAFT/);
});

test("Your draft delta highlight is gold-on-charcoal; Word export has Plain and Track Changes", () => {
  const css = readRepoFile("app/globals.css");
  const workbench = readRepoFile("components/Workbench.tsx");
  const draft = readRepoFile("components/DraftEditor.tsx");
  const editor = readRepoFile("components/EditorPane.tsx");
  const brand = readRepoFile("components/HeaderBrand.tsx");
  const exportStamps = readRepoFile("lib/export-stamps.ts");
  const exportRoute = readRepoFile("app/api/export/route.ts");

  assert.match(css, /\.draft-delta \{[\s\S]*#f4d56a/);
  assert.match(css, /\.draft-delta \{[\s\S]*#101218/);
  assert.match(draft, /data-delta-overlay="draft"/);
  assert.match(draft, /data-spell-overlay="draft"/);
  assert.match(draft, /insertRanges/);
  assert.match(editor, /original=\{compareBody != null \? compareBody : baseline\.body\}/);
  assert.equal(editor.includes("draft-delta"), false);
  assert.equal(editor.includes("data-draft-delta"), false);

  assert.match(workbench, /Export Word \(Plain\)/);
  assert.match(workbench, /Export Word \(Track Changes\)/);
  assert.match(workbench, /href="\/api\/export"/);
  assert.match(workbench, /href="\/api\/export\?kind=track-changes"/);
  assert.match(exportRoute, /kind === "track-changes"/);
  assert.match(exportStamps, /change-markup working draft for WG review/);

  assert.match(brand, /className="header-draft-mark"/);
  assert.match(brand, /headerDraftMark\(training\)/);
  assert.equal(brand.includes("WORKING COPY"), false);
});

test("thicker black pane seams, Add paragraph, no FRONT MATTER, SoC visual compare", () => {
  const css = readRepoFile("app/globals.css");
  const outline = readRepoFile("components/OutlinePane.tsx");
  const assist = readRepoFile("components/AssistPane.tsx");
  const editor = readRepoFile("components/EditorPane.tsx");
  const draft = readRepoFile("components/DraftEditor.tsx");
  const paneToggle = readRepoFile("components/PaneToggle.tsx");
  const summary = readRepoFile("components/SummaryOfChangePane.tsx");
  const workbench = readRepoFile("components/Workbench.tsx");
  const exportDocx = readRepoFile("lib/export-docx.ts");
  const userGuide = readRepoFile("components/UserGuide.tsx");
  const guideCopy = readRepoFile("content/user-guide.md");
  const walkthrough = readRepoFile("components/GuideWalkthrough.tsx");

  assert.match(css, /\.pane-split-y \{[\s\S]*3px solid #000/);
  assert.match(css, /\.pane-split-x \{[\s\S]*3px solid #000/);
  assert.match(css, /\.box-split \{[\s\S]*2px solid #000/);
  assert.match(outline, /pane-split-y/);
  assert.match(assist, /pane-split-x/);
  assert.match(paneToggle, /pane-split-y/);
  assert.match(editor, /box-split-b/);
  assert.match(draft, /box-split/);
  assert.match(workbench, /box-split-b/);

  assert.equal(outline.includes("Front matter"), false);
  assert.equal(outline.includes("FRONT MATTER"), false);
  assert.match(outline, /Summary of Change/);
  assert.match(outline, />DRAFT</);

  assert.match(outline, /Add paragraph/);
  assert.equal(outline.includes("Add child"), false);
  assert.match(guideCopy, /Add before \/ after \/ paragraph/);
  assert.equal(userGuide.includes("Add child"), false);
  assert.equal(guideCopy.includes("Add child"), false);
  assert.equal(walkthrough.includes("Add child"), false);

  assert.match(summary, /compareSegments/);
  assert.match(summary, /data-soc-ins/);
  assert.match(summary, /data-soc-del/);
  assert.match(css, /\.soc-ins \{[\s\S]*#f4d56a/);
  assert.match(css, /\.soc-del \{[\s\S]*#c4452f/);
  assert.match(summary, /SUMMARY_EXPORT_TITLE/);
  assert.match(exportDocx, /originalCell\(row\)/);
  assert.match(exportDocx, /revisedCell\(row\)/);
  assert.equal(exportDocx.includes("soc-ins"), false);
});

test("Justice: DRAFT / TRAINING / DRAFT is plain high-contrast text with dual seals; Word stamps unchanged", () => {
  const brand = readRepoFile("components/HeaderBrand.tsx");
  const css = readRepoFile("app/globals.css");
  const tailwind = readRepoFile("tailwind.config.ts");
  const workbench = readRepoFile("components/Workbench.tsx");
  const guide = readRepoFile("app/guide/page.tsx");
  const access = readRepoFile("app/access/page.tsx");
  const exportStamps = readRepoFile("lib/export-stamps.ts");
  const exportDocx = readRepoFile("lib/export-docx.ts");
  const exportRoute = readRepoFile("app/api/export/route.ts");

  assert.match(brand, /return training \? "TRAINING \/ DRAFT" : "DRAFT"/);
  assert.match(brand, /src="\/g1-seal\.png"/);
  assert.match(brand, /src="\/army-seal\.png"/);
  const g1Idx = brand.indexOf('src="/g1-seal.png"');
  const armyIdx = brand.indexOf('src="/army-seal.png"');
  const markIdx = brand.indexOf("header-draft-mark");
  assert.ok(g1Idx >= 0 && armyIdx > g1Idx && markIdx > armyIdx, "G-1, Army, then DRAFT mark — never seals alone");
  assert.equal(brand.includes("Hide"), false);
  assert.equal(brand.includes("<button"), false);
  assert.equal(brand.includes("<a "), false);
  assert.equal(brand.includes("href="), false);
  assert.equal(brand.includes("onClick"), false);
  assert.match(brand, /not an official Army publication/);
  assert.match(brand, /role="status"/);
  assert.match(brand, /data-draft-mark=""/);

  assert.match(tailwind, /black:\s*"#101218"/);
  assert.match(tailwind, /gold:\s*"#e2b84a"/);
  assert.match(css, /\.header-draft-mark \{[\s\S]*text-army-gold/);
  assert.match(css, /\.header-draft-mark \{[\s\S]*background:\s*none/);
  assert.match(css, /\.header-draft-mark \{[\s\S]*border:\s*0/);
  assert.match(css, /\.header-draft-mark \{[\s\S]*box-shadow:\s*none/);
  assert.match(css, /\.header-draft-mark \{[\s\S]*pointer-events:\s*none/);
  assert.match(css, /\.header-draft-mark \{[\s\S]*cursor:\s*default/);
  assert.equal(/\.header-draft-mark \{[^}]*bg-army-gold/.test(css), false);
  assert.equal(/\.header-draft-mark \{[^}]*rounded-lg/.test(css), false);
  assert.equal(/\.header-draft-mark \{[^}]*btn-header/.test(css), false);
  assert.equal(/\.header-draft-mark \{[^}]*hover:/.test(css), false);

  assert.match(workbench, /<HeaderBrand title=\{HEADER_TITLE\} training=\{state\.mode === "training"\} \/>/);
  assert.match(guide, /<HeaderBrand/);
  assert.match(access, /<HeaderBrand/);

  assert.equal(
    exportStamps,
    `export function wordHeaderMark(training: boolean): string {
  return training ? "TRAINING / DRAFT / WORKING COPY" : "DRAFT / WORKING COPY";
}

export function wordFooterMark(training: boolean): string {
  return training ? "TRAINING / DRAFT" : "DRAFT";
}

export const TRACK_CHANGES_COVER_LINE = "change-markup working draft for WG review";

export const TRACK_CHANGES_AUTHOR = "AR 600-85 Rewrite WG";
`,
  );
  assert.match(exportDocx, /draftRun\(wordHeaderMark\(training\)/);
  assert.match(exportDocx, /draftRun\(wordFooterMark\(training\)/);
  assert.match(exportRoute, /X-Draft-Stamp/);
});

