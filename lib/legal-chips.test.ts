import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { LIMITED_USE_RE, chipsFromWorkingText } from "./assist-bind.ts";
import {
  ADVERSE_ACTION_CATEGORY,
  GUIDE_LEGAL_ONE_LINER,
  LEGAL_CHIP_BODY,
  LIMITED_USE_CATEGORY,
  chipsInCategory,
  legalChipsFromWorkingText,
} from "./legal-chips.ts";

type SeedSection = { id: string; title: string; body: string };

function seedSection(id: string): SeedSection {
  const doc = JSON.parse(readFileSync(new URL("./seed/baseline-document.json", import.meta.url), "utf8")) as {
    chapters: { sections: SeedSection[] }[];
  };
  const section = doc.chapters.flatMap((chapter) => chapter.sections).find((item) => item.id === id);
  assert.ok(section, `missing seed section ${id}`);
  return section;
}

function titlesFor(section: SeedSection): string[] {
  const limitedUse = chipsFromWorkingText(section.title, section.body).limitedUse;
  return legalChipsFromWorkingText(section.title, section.body, limitedUse).map((chip) => chip.title);
}

test("Limited Use Policy title is only for self-referral / Limited Use / protected evidence", () => {
  const lup = legalChipsFromWorkingText(
    "Definition of the Limited Use Policy",
    "Limited Use protected evidence and self-referral.",
    true,
  );
  assert.deepEqual(
    lup.map((chip) => chip.title),
    ["Limited Use Policy (self-referral)"],
  );
  assert.equal(lup[0]?.category, LIMITED_USE_CATEGORY);
});

test("characterization without Limited Use is an adverse-action process-path hint, not Limited Use", () => {
  const hayTitle = "Use of Soldiers’ confirmed positive drug test results";
  const hayBody = "Characterization of service may follow a confirmed positive. Command-directed testing applies.";
  assert.equal(LIMITED_USE_RE.test(`${hayTitle} ${hayBody}`), true);
  const chips = legalChipsFromWorkingText(hayTitle, hayBody, chipsFromWorkingText(hayTitle, hayBody).limitedUse);
  const titles = chips.map((chip) => chip.title);
  assert.ok(!titles.includes("Limited Use Policy (self-referral)"));
  assert.ok(titles.includes("Legal / adverse-action hint — process path"));
  assert.ok(titles.includes("Legal / adverse-action hint — testing bases"));
  assert.equal(chipsInCategory(chips, LIMITED_USE_CATEGORY).length, 0);
  assert.ok(chipsInCategory(chips, ADVERSE_ACTION_CATEGORY).length >= 1);
});

test("42 CFR / EAP–TDP mix-up is a legal / adverse-action hint, not Limited Use", () => {
  const hayTitle = "Confidentiality of civilian client records";
  const hayBody = "42 CFR Part 2. Keep EAP distinct from TDP rules.";
  assert.equal(chipsFromWorkingText(hayTitle, hayBody).limitedUse, true);
  const chips = legalChipsFromWorkingText(hayTitle, hayBody, true);
  const titles = chips.map((chip) => chip.title);
  assert.ok(!titles.includes("Limited Use Policy (self-referral)"));
  assert.ok(titles.includes("Legal / adverse-action hint — rights / Art. 31"));
  assert.ok(titles.includes("Legal / adverse-action hint — civilian path"));
});

test("Art. 31 / DA Form 3881 titles as rights / Art. 31 when the existing legal gate already fired", () => {
  const hayTitle = "Commander process";
  const hayBody =
    "If Limited Use Policy applies, consult SJA. If not, advise the Soldier of rights under UCMJ Article 31(b) using DA Form 3881.";
  const chips = legalChipsFromWorkingText(hayTitle, hayBody, true);
  const titles = chips.map((chip) => chip.title);
  assert.ok(titles.includes("Limited Use Policy (self-referral)"));
  assert.ok(titles.includes("Legal / adverse-action hint — rights / Art. 31"));
});

test("title split does not invent chips when the existing limitedUse gate is false", () => {
  const hayTitle = "Drug-Free Workplace Testing Designated Positions";
  const hayBody = "TDP employees may use EAP. Probable cause testing is a separate civilian path.";
  assert.equal(chipsFromWorkingText(hayTitle, hayBody).limitedUse, false);
  assert.deepEqual(legalChipsFromWorkingText(hayTitle, hayBody, false), []);
});

test("seed paragraphs show the five Justice titles without relabeling 10–3 or 6–7 as Limited Use", () => {
  const lup = titlesFor(seedSection("10-12"));
  const process = titlesFor(seedSection("10-3"));
  const civilian = titlesFor(seedSection("6-7"));
  const testing = titlesFor(seedSection("4-5"));
  const art31 = titlesFor(seedSection("B-5"));
  assert.ok(lup.includes("Limited Use Policy (self-referral)"));
  assert.ok(!process.includes("Limited Use Policy (self-referral)"));
  assert.ok(process.includes("Legal / adverse-action hint — process path"));
  assert.ok(process.includes("Legal / adverse-action hint — testing bases"));
  assert.ok(!civilian.includes("Limited Use Policy (self-referral)"));
  assert.ok(civilian.includes("Legal / adverse-action hint — civilian path"));
  assert.ok(civilian.includes("Legal / adverse-action hint — rights / Art. 31"));
  assert.ok(testing.includes("Legal / adverse-action hint — testing bases"));
  assert.ok(art31.includes("Legal / adverse-action hint — rights / Art. 31"));
});

test("locked legal body and Guide one-liner stay the accepted copy", () => {
  assert.equal(
    LEGAL_CHIP_BODY,
    "Cite the sister publication; do not copy its procedures here. Point flagging and separation actions to those regulations. Do not expand protected evidence.",
  );
  assert.match(GUIDE_LEGAL_ONE_LINER, /Limited Use Policy \(self-referral\)/);
  assert.match(GUIDE_LEGAL_ONE_LINER, /Legal \/ adverse-action hints/);
  assert.match(GUIDE_LEGAL_ONE_LINER, /Don’t read every legal chip as Limited Use/);
});
