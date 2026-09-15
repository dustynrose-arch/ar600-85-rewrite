import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { LIMITED_USE_RE, chipsFromWorkingText } from "./assist-bind.ts";
import {
  ADVERSE_ACTION_CATEGORY,
  GUIDE_LEGAL_ONE_LINER,
  LEGAL_CHIP_BODY,
  LIMITED_USE_ASSIST_SECTION_IDS,
  LIMITED_USE_CATEGORY,
  LIMITED_USE_CHIP_TITLE,
  LIMITED_USE_SEE_CITE,
  chipsInCategory,
  legalChipsFromWorkingText,
  sectionHidesLimitedUseAssist,
  sectionWarrantsLimitedUseAssist,
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
  return legalChipsFromWorkingText(section.title, section.body, limitedUse, section.id).map((chip) => chip.title);
}

test("Limited Use Assist is hidden by default", () => {
  const lupWording = legalChipsFromWorkingText(
    "Definition of the Limited Use Policy",
    "Limited Use protected evidence and self-referral.",
    true,
  );
  assert.equal(chipsInCategory(lupWording, LIMITED_USE_CATEGORY).length, 0);
  assert.equal(sectionWarrantsLimitedUseAssist(undefined), false);
  assert.equal(sectionWarrantsLimitedUseAssist(null), false);
  assert.equal(sectionWarrantsLimitedUseAssist(""), false);
});

test("Limited Use Assist is shown for a warranted section such as 10-12", () => {
  const chips = legalChipsFromWorkingText(
    "Definition of the Limited Use Policy",
    "Limited Use protected evidence and self-referral.",
    true,
    "10-12",
  );
  const lup = chipsInCategory(chips, LIMITED_USE_CATEGORY);
  assert.deepEqual(
    lup.map((chip) => chip.title),
    [LIMITED_USE_CHIP_TITLE],
  );
  assert.equal(lup[0]?.category, LIMITED_USE_CATEGORY);
  assert.equal(lup[0]?.seeCite, LIMITED_USE_SEE_CITE);
  assert.equal(LIMITED_USE_SEE_CITE, "See para 10-12 / 10-13");
  assert.equal(sectionWarrantsLimitedUseAssist("10-12"), true);
  assert.ok(titlesFor(seedSection("10-12")).includes(LIMITED_USE_CHIP_TITLE));
  const withoutTextGate = legalChipsFromWorkingText("Purpose", "No legal keywords.", false, "10-12");
  assert.deepEqual(
    withoutTextGate.map((chip) => chip.title),
    [LIMITED_USE_CHIP_TITLE],
  );
});

test("Limited Use Assist stays hidden for an unrelated chapter", () => {
  const chips = legalChipsFromWorkingText(
    "Definition of the Limited Use Policy",
    "Limited Use protected evidence and self-referral.",
    true,
    "1-1",
  );
  assert.equal(chipsInCategory(chips, LIMITED_USE_CATEGORY).length, 0);
  assert.equal(sectionWarrantsLimitedUseAssist("1-1"), false);
  assert.equal(sectionWarrantsLimitedUseAssist("4-5"), false);
  const purpose = titlesFor(seedSection("1-1"));
  assert.ok(!purpose.includes(LIMITED_USE_CHIP_TITLE));
});

test("display-number lookalikes do not warrant Limited Use — only the stable outline id", () => {
  assert.equal(sectionWarrantsLimitedUseAssist("wc-other"), false);
  const byNumber = legalChipsFromWorkingText("Unrelated", "No ASAP terms here. Display number looks like 10-12.", true, "wc-other");
  assert.equal(chipsInCategory(byNumber, LIMITED_USE_CATEGORY).length, 0);
});

test("characterization without a warranted Limited Use section is an adverse-action process-path hint, not Limited Use", () => {
  const hayTitle = "Use of Soldiers’ confirmed positive drug test results";
  const hayBody = "Characterization of service may follow a confirmed positive. Command-directed testing applies.";
  assert.equal(LIMITED_USE_RE.test(`${hayTitle} ${hayBody}`), true);
  const chips = legalChipsFromWorkingText(
    hayTitle,
    hayBody,
    chipsFromWorkingText(hayTitle, hayBody).limitedUse,
    "10-3",
  );
  const titles = chips.map((chip) => chip.title);
  assert.ok(!titles.includes(LIMITED_USE_CHIP_TITLE));
  assert.ok(titles.includes("Legal / adverse-action hint — process path"));
  assert.ok(titles.includes("Legal / adverse-action hint — testing bases"));
  assert.equal(chipsInCategory(chips, LIMITED_USE_CATEGORY).length, 0);
  assert.ok(chipsInCategory(chips, ADVERSE_ACTION_CATEGORY).length >= 1);
});

test("42 CFR / EAP–TDP mix-up is a legal / adverse-action hint, not Limited Use", () => {
  const hayTitle = "Confidentiality of civilian client records";
  const hayBody = "42 CFR Part 2. Keep EAP distinct from TDP rules.";
  assert.equal(chipsFromWorkingText(hayTitle, hayBody).limitedUse, true);
  const chips = legalChipsFromWorkingText(hayTitle, hayBody, true, "6-7");
  const titles = chips.map((chip) => chip.title);
  assert.ok(!titles.includes(LIMITED_USE_CHIP_TITLE));
  assert.ok(titles.includes("Legal / adverse-action hint — rights / Art. 31"));
  assert.ok(titles.includes("Legal / adverse-action hint — civilian path"));
});

test("Art. 31 / DA Form 3881 titles as rights / Art. 31 when the existing legal gate already fired", () => {
  const hayTitle = "Commander process";
  const hayBody =
    "If Limited Use Policy applies, consult SJA. If not, advise the Soldier of rights under UCMJ Article 31(b) using DA Form 3881.";
  const chips = legalChipsFromWorkingText(hayTitle, hayBody, true, "B-5");
  const titles = chips.map((chip) => chip.title);
  assert.ok(titles.includes(LIMITED_USE_CHIP_TITLE));
  assert.ok(titles.includes("Legal / adverse-action hint — rights / Art. 31"));
});

test("title split does not invent chips when the existing limitedUse gate is false", () => {
  const hayTitle = "Drug-Free Workplace Testing Designated Positions";
  const hayBody = "TDP employees may use EAP. Probable cause testing is a separate civilian path.";
  assert.equal(chipsFromWorkingText(hayTitle, hayBody).limitedUse, false);
  assert.deepEqual(legalChipsFromWorkingText(hayTitle, hayBody, false), []);
  assert.deepEqual(legalChipsFromWorkingText(hayTitle, hayBody, false, "5-8"), []);
});

test("seed paragraphs show the five Justice titles without relabeling 10–3 or 6–7 as Limited Use", () => {
  const lup = titlesFor(seedSection("10-12"));
  const process = titlesFor(seedSection("10-3"));
  const civilian = titlesFor(seedSection("6-7"));
  const testing = titlesFor(seedSection("4-5"));
  const art31 = titlesFor(seedSection("B-5"));
  assert.ok(lup.includes(LIMITED_USE_CHIP_TITLE));
  assert.ok(!process.includes(LIMITED_USE_CHIP_TITLE));
  assert.ok(process.includes("Legal / adverse-action hint — process path"));
  assert.ok(process.includes("Legal / adverse-action hint — testing bases"));
  assert.ok(!civilian.includes(LIMITED_USE_CHIP_TITLE));
  assert.ok(civilian.includes("Legal / adverse-action hint — civilian path"));
  assert.ok(civilian.includes("Legal / adverse-action hint — rights / Art. 31"));
  assert.ok(testing.includes("Legal / adverse-action hint — testing bases"));
  assert.ok(art31.includes("Legal / adverse-action hint — rights / Art. 31"));
  assert.ok(art31.includes(LIMITED_USE_CHIP_TITLE));
});

test("warranted Limited Use ids cover policy cluster, self-referral, briefing, and biochemical ID", () => {
  for (const id of [
    "10-11",
    "10-12",
    "10-13",
    "10-15",
    "7-1",
    "7-2",
    "7-3",
    "7-4",
    "7-5",
    "7-6",
    "7-7",
    "9-11",
    "B-5",
    "B-10",
  ]) {
    assert.equal(sectionWarrantsLimitedUseAssist(id), true, id);
    assert.equal(sectionHidesLimitedUseAssist(id), false, id);
  }
  assert.deepEqual([...LIMITED_USE_ASSIST_SECTION_IDS].sort(), [
    "10-11",
    "10-12",
    "10-13",
    "10-15",
    "7-1",
    "7-2",
    "7-3",
    "7-4",
    "7-5",
    "7-6",
    "7-7",
    "9-11",
    "B-10",
    "B-5",
  ]);
});

test("Limited Use standing panel stays hidden on Purpose, ASAP admin, ADAPT/SUDCC how-to, and unrelated chapters", () => {
  const lupDraft = "Limited Use Policy and self-referral protected evidence.";
  for (const id of ["1-1", "1-7", "2-1", "4-5", "8-2", "9-14", "12-1"]) {
    assert.equal(sectionHidesLimitedUseAssist(id), true, id);
    assert.equal(sectionWarrantsLimitedUseAssist(id, "Purpose", lupDraft), false, id);
    const chips = legalChipsFromWorkingText("Purpose", lupDraft, true, id);
    assert.equal(chipsInCategory(chips, LIMITED_USE_CATEGORY).length, 0, id);
  }
  assert.ok(!titlesFor(seedSection("1-1")).includes(LIMITED_USE_CHIP_TITLE));
  assert.ok(!titlesFor(seedSection("9-14")).includes(LIMITED_USE_CHIP_TITLE));
  assert.ok(!titlesFor(seedSection("8-2")).includes(LIMITED_USE_CHIP_TITLE));
});

test("draft hits show Limited Use on a new working-copy id, not on hide-family chapters", () => {
  const moved = legalChipsFromWorkingText(
    "Self-identification",
    "Soldier seeks help. Self-referral and protected evidence.",
    true,
    "wc-split",
  );
  assert.ok(chipsInCategory(moved, LIMITED_USE_CATEGORY).length === 1);
  const admin = legalChipsFromWorkingText(
    "Program authority",
    "Soldier seeks help. Self-referral and protected evidence.",
    true,
    "1-6",
  );
  assert.equal(chipsInCategory(admin, LIMITED_USE_CATEGORY).length, 0);
});

test("self-ID treated as open season stays an adverse-action chip, not the Limited Use standing panel", () => {
  const chips = legalChipsFromWorkingText(
    "Use of Soldiers’ confirmed positive drug test results",
    "Self-identification is open season for characterization of service and UCMJ.",
    true,
    "10-3",
  );
  assert.equal(chipsInCategory(chips, LIMITED_USE_CATEGORY).length, 0);
  assert.ok(chips.map((chip) => chip.title).includes("Legal / adverse-action hint — process path"));
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

test("AssistPane gates Limited Use on the open section id and cites 10-12 / 10-13 without auto-rewrite", () => {
  const assist = readFileSync(new URL("../components/AssistPane.tsx", import.meta.url), "utf8");
  assert.match(
    assist,
    /legalChipsFromWorkingText\(working\.title, draftBody \?\? working\.body, chips\.limitedUse, working\.id\)/,
  );
  assert.match(assist, /lupChips\.length \? \(/);
  assert.match(assist, /LIMITED_USE_SEE_CITE/);
  assert.match(assist, /Suggestion only — Writing Assistant does not rewrite this paragraph/);
  assert.equal(assist.includes("No Limited Use Policy (self-referral) language in the current paragraph."), false);
});
