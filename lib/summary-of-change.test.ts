import assert from "node:assert/strict";
import { test } from "node:test";
import type { Section } from "./types.ts";
import {
  actionLabel,
  buildSummaryOfChange,
  formatParaCite,
  originalCell,
  parseApdUnits,
  reconstructUnit,
  revisedCell,
  SUMMARY_ADDS_ORIGINAL,
  SUMMARY_EXPORT_TITLE,
  SUMMARY_RESCINDS_REVISED,
  SUMMARY_TABLE_COLUMNS,
} from "./summary-of-change.ts";

function section(id: string, number: string, title: string, body: string): Section {
  return { id, number, title, body };
}

test("formats APD paragraph cites with en-dash and subpara markers", () => {
  assert.equal(formatParaCite("1-1"), "para 1–1");
  assert.equal(formatParaCite("1-4", "a(1)"), "para 1–4a(1)");
  assert.equal(formatParaCite("4-2", "n"), "para 4–2n");
  assert.equal(formatParaCite("A-1", "a"), "para A–1a");
});

test("parses lead-in plus a./(1)/(a) hierarchy", () => {
  const units = parseApdUnits(
    [
      "Lead sentence.",
      "a. First letter.",
      "  (1) First number.",
      "    (a) Nested letter.",
      "    (b) Second nested.",
      "      (i) Roman child.",
      "b. Second letter.",
    ].join("\n"),
  );
  assert.equal(units.length, 3);
  assert.equal(units[0].kind, "lead");
  assert.equal(units[0].text, "Lead sentence.");
  assert.equal(units[1].marker, "a");
  assert.equal(units[1].children[0].marker, "(1)");
  assert.equal(units[1].children[0].children[0].marker, "(a)");
  assert.equal(units[1].children[0].children[1].children[0].marker, "(i)");
  assert.equal(units[2].marker, "b");
});

test("builds Revises / Adds / Rescinds from real paragraph diffs", () => {
  const original = {
    "1-1": section(
      "1-1",
      "1-1",
      "Purpose",
      "This regulation prescribes the ACTIVE Purpose lead.",
    ),
    "1-4": section(
      "1-4",
      "1-4",
      "Responsibilities",
      ["a. Commanders will—", "  (1) Enforce testing.", "  (2) Keep records."].join("\n"),
    ),
    "4-2": section(
      "4-2",
      "4-2",
      "Policy",
      ["a. Random testing.", "b. Commanders execute.", "m. Legacy closeout."].join("\n"),
    ),
    "1-9": section("1-9", "1-9", "Labor relations", "Activities must meet labor relations obligations."),
  };
  const draft = {
    "1-1": section("1-1", "1-1", "Purpose", "This regulation prescribes the draft Purpose."),
    "1-4": section(
      "1-4",
      "1-4",
      "Responsibilities",
      ["a. Commanders will—", "  (1) Enforce testing and notify G–1.", "  (2) Keep records."].join("\n"),
    ),
    "4-2": section(
      "4-2",
      "4-2",
      "Policy",
      [
        "a. Random testing.",
        "b. Commanders execute.",
        "n. Soldiers are encouraged to avoid poppy seeds.",
      ].join("\n"),
    ),
    "1-9": section("1-9", "1-9", "Labor relations", ""),
  };

  const result = buildSummaryOfChange(original, draft, Object.values(original));
  assert.equal(
    result.title,
    "Summary of Change (DRAFT — working copy; not authenticated under AR 25-30 / DA Pam 25-40)",
  );
  assert.equal(result.title, SUMMARY_EXPORT_TITLE);
  assert.deepEqual(SUMMARY_TABLE_COLUMNS, [
    "Action",
    "Location",
    "Original (ACTIVE)",
    "Revised (your draft)",
  ]);
  assert.equal(result.movesDeferred, true);

  const revisesPurpose = result.rows.find((row) => row.cite === "para 1–1");
  assert.ok(revisesPurpose);
  assert.equal(revisesPurpose.action, "revises");
  assert.match(revisesPurpose.originalText ?? "", /ACTIVE Purpose lead/);
  assert.match(revisesPurpose.revisedText ?? "", /draft Purpose/);

  const revisesSub = result.rows.find((row) => row.cite === "para 1–4a(1)");
  assert.ok(revisesSub);
  assert.equal(revisesSub.action, "revises");
  assert.equal(revisesSub.originalText, "Enforce testing.");
  assert.equal(revisesSub.revisedText, "Enforce testing and notify G–1.");

  const adds = result.rows.find((row) => row.cite === "para 4–2n");
  assert.ok(adds);
  assert.equal(adds.action, "adds");
  assert.match(adds.revisedText ?? "", /poppy seeds/);
  assert.equal(adds.originalText, null);
  assert.equal(originalCell(adds), SUMMARY_ADDS_ORIGINAL);
  assert.match(revisedCell(adds), /poppy seeds/);

  const rescindsLetter = result.rows.find((row) => row.cite === "para 4–2m");
  assert.ok(rescindsLetter);
  assert.equal(rescindsLetter.action, "rescinds");
  assert.match(rescindsLetter.originalText ?? "", /Legacy closeout/);
  assert.equal(revisedCell(rescindsLetter), SUMMARY_RESCINDS_REVISED);

  const rescindsPara = result.rows.find((row) => row.cite === "para 1–9");
  assert.ok(rescindsPara);
  assert.equal(rescindsPara.action, "rescinds");

  assert.equal(result.counts.total, result.rows.length);
  assert.equal(result.counts.revises, 2);
  assert.equal(result.counts.adds, 1);
  assert.equal(result.counts.rescinds, 2);
  assert.equal(actionLabel("revises"), "Revises");
});

test("does not treat wrapped mid-sentence (1)/(2) as new units", () => {
  const body = [
    "a. Qualifications.",
    "  (1) Be an officer.",
    "  (6) Commanders should request a review. Requirements in paragraphs 9–6a(1)",
    "  (1) through 9–6a(5), above, are not waiverable.",
    "b. Next letter.",
    "  (1) If military personnel are available.",
    "    (a) FY Units with two",
    "  (2) or more certified UDLs Rate.",
  ].join("\n");
  const units = parseApdUnits(body);
  assert.equal(units.map((unit) => unit.marker).join(","), "a,b");
  assert.equal(units[0].children.map((child) => child.marker).join(","), "(1),(6)");
  assert.match(units[0].children[1].text, /through 9–6a\(5\)/);
  assert.equal(units[1].children.map((child) => child.marker).join(","), "(1)");
  assert.match(units[1].children[0].children[0].text, /or more certified UDLs Rate/);
  const sec = section("9-6", "9-6", "UDL", body);
  assert.equal(buildSummaryOfChange({ "9-6": sec }, { "9-6": sec }, [sec]).rows.length, 0);
});

test("does not emit rows when original and draft match", () => {
  const body = "a. Same wording.\n  (1) Nested same.";
  const sec = section("2-1", "2-1", "Same", body);
  const result = buildSummaryOfChange({ "2-1": sec }, { "2-1": sec }, [sec]);
  assert.equal(result.rows.length, 0);
});

test("reconstructs added lettered text with children as one Adds row", () => {
  const original = {
    "3-1": section("3-1", "3-1", "General", "a. Keep me."),
  };
  const draft = {
    "3-1": section(
      "3-1",
      "3-1",
      "General",
      ["a. Keep me.", "b. New duty.", "  (1) Child of the add."].join("\n"),
    ),
  };
  const result = buildSummaryOfChange(original, draft, Object.values(original));
  assert.deepEqual(
    result.rows.map((row) => `${row.action} ${row.cite}`),
    ["adds para 3–1b"],
  );
  assert.match(result.rows[0].revisedText ?? "", /Child of the add/);
  assert.match(reconstructUnit(parseApdUnits(draft["3-1"].body)[1]), /b\.\s+New duty/);
});
