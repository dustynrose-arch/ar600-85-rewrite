import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { GUIDE_ANCHORS } from "./guide.ts";
import { parseGuideMarkdown, slugifyHeading } from "./guide-markdown.ts";

function readGuideCopy(): string {
  return readFileSync(new URL("../content/user-guide.md", import.meta.url), "utf8");
}

test("User Guide copy ships sections 0–21 plus working-group access", () => {
  const copy = readGuideCopy();
  const blocks = parseGuideMarkdown(copy);
  const headings = blocks
    .filter((block) => block.type === "h1" || block.type === "h2" || block.type === "h3")
    .map((block) => ("text" in block ? block.text : ""));

  assert.equal(headings[0], "AR 600–85 Rewrite — User Guide");
  for (const required of [
    "0. Purpose",
    "Working-group access (password gate)",
    "Part A — Orient the workspace",
    "Part B — Edit your draft",
    "Part C — See what changed",
    "Part D — Writing Assistant (only when warranted)",
    "Part E — Document crossmatch",
    "Part F — Practice safely",
    "Part G — Hand off (export)",
    "Part H — Roles, gates, and session safety",
    "20. First-session quick path",
    "21. Quick reference",
  ]) {
    assert.ok(headings.includes(required), `missing heading: ${required}`);
  }

  assert.match(copy, /\*\*Writing Assistant\*\*/);
  assert.match(copy, /\*\*Plain\*\* · \*\*Track Changes\*\* · \*\*Summary\*\*/);
  assert.match(copy, /Hide Writing Assistant/);
  assert.match(copy, /rust ●/);
  assert.match(copy, /When Limited Use appears/);
  assert.match(copy, /When Limited Use stays hidden/);
  assert.match(copy, /Closing the browser clears it/);
  assert.match(copy, /Click \*\*Log out\*\*/);
  assert.equal(copy.includes("often does not log you out"), false);
});

test("User Guide copy strips review-file internals and outdated labels", () => {
  const copy = readGuideCopy();
  const userGuide = readFileSync(new URL("../components/UserGuide.tsx", import.meta.url), "utf8");
  const walkthrough = readFileSync(new URL("../components/GuideWalkthrough.tsx", import.meta.url), "utf8");
  const overlay = readFileSync(new URL("../components/UserGuideOverlay.tsx", import.meta.url), "utf8");
  const shipped = `${copy}\n${userGuide}\n${walkthrough}\n${overlay}`;

  assert.equal(/##\s*22\b/.test(copy), false);
  assert.equal(copy.includes("Related review files"), false);
  assert.equal(shipped.includes("Embed note"), false);
  assert.equal(shipped.includes("Embed note for Coder"), false);
  assert.equal(shipped.includes("/Users/"), false);
  assert.equal(shipped.includes("Tutor/"), false);
  assert.equal(shipped.includes("Influencer/"), false);
  assert.equal(copy.includes("gold-and-black"), false);
  assert.equal(/\bHide Assist\b/.test(shipped), false);
  assert.match(copy, /not a gold dot/);
  assert.equal(walkthrough.includes("gold dot"), false);
  assert.equal(walkthrough.includes("Word export"), false);
  assert.equal(shipped.toLowerCase().includes("tutorial"), false);
  assert.equal(shipped.includes(".mp4"), false);
  assert.equal(shipped.includes("walkthrough + video"), false);
  assert.equal(shipped.includes("Short videos coming soon"), false);
  assert.equal(shipped.includes("Tutorial videos"), false);
});

test("User Guide contents anchors match shipped headings", () => {
  const copy = readGuideCopy();
  const headingIds = new Set(
    parseGuideMarkdown(copy)
      .filter((block) => block.type === "h2" || block.type === "h3")
      .map((block) => ("id" in block ? block.id : "")),
  );
  for (const anchor of GUIDE_ANCHORS) {
    assert.ok(headingIds.has(anchor.id), `missing heading id for ${anchor.label}: ${anchor.id}`);
  }
  assert.equal(slugifyHeading("16–17. Export: Plain · Track Changes · Summary"), "16-17-export-plain-track-changes-summary");
});

test("User Guide mounts the text guide and First-session walkthrough, not a video player", () => {
  const userGuide = readFileSync(new URL("../components/UserGuide.tsx", import.meta.url), "utf8");
  const assist = readFileSync(new URL("../components/AssistPane.tsx", import.meta.url), "utf8");
  const overlay = readFileSync(new URL("../components/UserGuideOverlay.tsx", import.meta.url), "utf8");
  const workbench = readFileSync(new URL("../components/Workbench.tsx", import.meta.url), "utf8");
  const guidePage = readFileSync(new URL("../app/guide/page.tsx", import.meta.url), "utf8");
  assert.match(userGuide, /<GuideWalkthrough \/>/);
  assert.match(userGuide, /<GuideMarkdown source=\{USER_GUIDE_MARKDOWN\} \/>/);
  assert.match(userGuide, /text-army-cream/);
  assert.equal(userGuide.includes("GuideVideo"), false);
  assert.equal(userGuide.includes("<video"), false);
  assert.match(assist, />\s*Open User Guide\s*</);
  assert.equal(assist.includes("walkthrough + video"), false);
  assert.equal(assist.includes("GuideVideo"), false);
  assert.match(overlay, /role="dialog"/);
  assert.match(overlay, /Escape/);
  assert.match(overlay, />\s*Close\s*</);
  assert.match(workbench, /<UserGuideOverlay/);
  assert.equal(workbench.includes('href="/guide"'), false);
  assert.match(guidePage, /redirect\("\/\?guide=1"\)/);
  assert.equal(existsSync(new URL("../components/GuideVideo.tsx", import.meta.url)), false);
  assert.equal(existsSync(new URL("../components/GuideWalkthrough.tsx", import.meta.url)), true);
  assert.equal(existsSync(new URL("../public/guide/tutorial.mp4", import.meta.url)), false);
});

test("export How list keeps live vs Training stamp bullets nested", () => {
  const copy = readGuideCopy();
  const blocks = parseGuideMarkdown(copy);
  const exportHow = blocks.find(
    (block) =>
      block.type === "ol" &&
      block.items.some((item) => item.text.includes("Click **Plain**, **Track Changes**, or **Summary**")),
  );
  assert.ok(exportHow && exportHow.type === "ol");
  const stampItem = exportHow.items.find((item) => item.text.includes("stamps always on"));
  assert.ok(stampItem?.nested?.some((line) => line.includes("`DRAFT / WORKING COPY`")));
  assert.ok(stampItem?.nested?.some((line) => line.includes("`TRAINING / DRAFT / WORKING COPY`")));
});
