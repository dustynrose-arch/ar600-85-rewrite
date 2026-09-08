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
import {
  dropAssistState,
  emptyAssistBinding,
  processHighlightIds,
  seedAssistBindings,
} from "./assist-bind.ts";
import { buildSummaryOfChange } from "./summary-of-change.ts";
import type { AssistBinding, BaselineDocument, Section, WorkingSection } from "./types.ts";

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

test("structure smoke: split keeps source assist; delete drops it; never keys off display number", () => {
  const original = sectionMap();
  const outline = seedWorkingOutline(baselineDocument);
  const draft: Record<string, WorkingSection> = Object.fromEntries(
    Object.values(original).map((section) => [section.id, asWorking(section)]),
  );
  const bindings: Record<string, AssistBinding> = seedAssistBindings(draft);
  const sourceId = "7-3";
  const sourceBinding = structuredClone(bindings[sourceId]);
  assert.ok(sourceBinding.processNodeIds.includes("id-self"));

  const splitOutline = insertSectionId(outline, "wc-split", sourceId, "after");
  draft["wc-split"] = asWorking({
    id: "wc-split",
    number: "",
    title: "New paragraph",
    body: "",
  });
  applyDisplayNumbers(splitOutline, draft);
  bindings[sourceId] = sourceBinding;
  bindings["wc-split"] = emptyAssistBinding("wc-split");

  assert.equal(draft[sourceId].id, sourceId);
  assert.notEqual(draft[sourceId].number, draft["wc-split"].number);
  assert.deepEqual(bindings[sourceId], sourceBinding);
  assert.deepEqual(bindings["wc-split"].glossaryTermIds, []);
  assert.equal(bindings["wc-split"].limitedUse, false);
  assert.deepEqual(bindings["wc-split"].processNodeIds, []);
  assert.deepEqual(processHighlightIds(sourceId, new Set(Object.keys(draft))), sourceBinding.processNodeIds);
  assert.deepEqual(processHighlightIds("wc-split", new Set(Object.keys(draft))), []);

  const afterDelete = deleteSectionId(splitOutline, sourceId);
  delete draft[sourceId];
  dropAssistState({ assistBindings: bindings, wgReviewMarks: [{ sectionId: sourceId }], sergeant: [] }, sourceId);
  applyDisplayNumbers(afterDelete.outline, draft);

  assert.equal(bindings[sourceId], undefined);
  assert.ok(bindings["wc-split"]);
  assert.deepEqual(processHighlightIds(sourceId, new Set(Object.keys(draft))), []);
});
