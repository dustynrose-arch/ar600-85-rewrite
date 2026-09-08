import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  applyDisplayNumbers,
  deleteSectionId,
  insertSectionId,
  moveSectionId,
  parentIndexFromDocument,
  parentIndexFromOutline,
  seedWorkingOutline,
} from "./outline.ts";
import { buildSummaryOfChange } from "./summary-of-change.ts";
import type { BaselineDocument, Section, WorkingSection } from "./types.ts";

const baselineDocument = JSON.parse(
  readFileSync(fileURLToPath(new URL("./seed/baseline-document.json", import.meta.url)), "utf8"),
) as BaselineDocument;

function sectionMap(): Record<string, Section> {
  return Object.fromEntries(
    baselineDocument.chapters.flatMap((chapter) => chapter.sections).map((section) => [section.id, section]),
  );
}

function asWorking(section: Section): WorkingSection {
  return { ...section, updatedAt: "2026-01-01T00:00:00.000Z", updatedBy: "editor" };
}

test("structure smoke: add/delete/move/rename flag Summary without body keystrokes", () => {
  const original = sectionMap();
  const outline = seedWorkingOutline(baselineDocument);
  const draft: Record<string, WorkingSection> = Object.fromEntries(
    Object.values(original).map((section) => [section.id, asWorking(section)]),
  );
  const beforeBaseline = JSON.stringify(baselineDocument);

  const added = insertSectionId(outline, "wc-smoke", "1-1", "after");
  draft["wc-smoke"] = asWorking({
    id: "wc-smoke",
    number: "",
    title: "Commander’s intent",
    body: "",
  });
  applyDisplayNumbers(added, draft);

  const renamed = added;
  draft["1-1"] = { ...draft["1-1"], title: "Purpose and scope" };

  const deleted = deleteSectionId(renamed, "1-9");
  delete draft["1-9"];
  applyDisplayNumbers(deleted.outline, draft);

  const moved = moveSectionId(deleted.outline, "1-4", "2", 0);
  applyDisplayNumbers(moved.outline, draft);

  const order = moved.outline.flatMap((chapter) =>
    chapter.sectionIds.map((id) => draft[id]).filter(Boolean),
  );
  const summary = buildSummaryOfChange(original, draft, order, {
    original: parentIndexFromDocument(baselineDocument),
    draft: parentIndexFromOutline(moved.outline),
  });

  assert.equal(JSON.stringify(baselineDocument), beforeBaseline);
  assert.equal(draft["1-1"].id, "1-1");
  assert.equal(draft["1-4"].id, "1-4");
  assert.equal(draft["1-4"].number, "2-1");
  assert.equal(draft["2-1"].number, "2-2");

  const titleRow = summary.rows.find((row) => row.id === "revises:1-1:title");
  assert.ok(titleRow);
  assert.equal(titleRow.action, "revises");
  assert.equal(titleRow.originalText, "Purpose");
  assert.equal(titleRow.revisedText, "Purpose and scope");

  const addRow = summary.rows.find((row) => row.sectionId === "wc-smoke");
  assert.ok(addRow);
  assert.equal(addRow.action, "adds");

  const rescind = summary.rows.find((row) => row.sectionId === "1-9");
  assert.ok(rescind);
  assert.equal(rescind.action, "rescinds");

  const moveRow = summary.rows.find((row) => row.action === "moves" && row.sectionId === "1-4");
  assert.ok(moveRow);
  assert.match(moveRow.originalText ?? "", /para 1–4/);
  assert.match(moveRow.revisedText ?? "", /para 2–1/);

  const bodyOnly = buildSummaryOfChange(
    { "1-1": original["1-1"] },
    { "1-1": { ...asWorking(original["1-1"]), body: `${original["1-1"].body} extra.` } },
    [original["1-1"]],
  );
  assert.equal(bodyOnly.rows.some((row) => row.action === "moves"), false);
  assert.equal(bodyOnly.rows.some((row) => row.id.endsWith(":title")), false);
  assert.equal(summary.movesDeferred, false);
});
