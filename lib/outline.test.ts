import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  applyDisplayNumbers,
  chapterDisplayLabel,
  cloneOutline,
  deleteSectionId,
  insertSectionId,
  moveSectionId,
  movedSectionIds,
  parentIndexFromDocument,
  parentIndexFromOutline,
  seedWorkingOutline,
} from "./outline.ts";
import type { BaselineDocument, Section, WorkingOutlineChapter } from "./types.ts";

const baselineDocument = JSON.parse(
  readFileSync(fileURLToPath(new URL("./seed/baseline-document.json", import.meta.url)), "utf8"),
) as BaselineDocument;

function sampleOutline(): WorkingOutlineChapter[] {
  return [
    { id: "1", kind: "chapter", title: "General", sectionIds: ["1-1", "1-2", "1-3"] },
    { id: "2", kind: "chapter", title: "Responsibilities", sectionIds: ["2-1", "2-2"] },
    { id: "A", kind: "appendix", title: "References", sectionIds: ["A-1"] },
  ];
}

function sectionsFrom(outline: WorkingOutlineChapter[]): Record<string, Section> {
  const sections: Record<string, Section> = {};
  for (const chapter of outline) {
    for (const id of chapter.sectionIds) {
      sections[id] = { id, number: id, title: `Title ${id}`, body: `Body ${id}` };
    }
  }
  applyDisplayNumbers(outline, sections);
  return sections;
}

test("seed outline matches ACTIVE chapter→para shape and keeps seed ids", () => {
  const outline = seedWorkingOutline(baselineDocument);
  assert.equal(outline[0].kind, "chapter");
  assert.equal(outline[0].sectionIds[0], "1-1");
  const appendix = outline.find((chapter) => chapter.id === "A");
  assert.ok(appendix);
  assert.equal(appendix.kind, "appendix");
  assert.equal(chapterDisplayLabel(appendix, outline), "Appendix A");
  assert.ok(outline.some((chapter) => chapter.sectionIds.includes("10-12")));
});

test("insert before/after/child and renumber within the parent", () => {
  const outline = sampleOutline();
  const sections = sectionsFrom(outline);
  const afterInsert = insertSectionId(outline, "wc-new", "1-1", "after");
  sections["wc-new"] = { id: "wc-new", number: "", title: "Inserted", body: "" };
  applyDisplayNumbers(afterInsert, sections);
  assert.deepEqual(afterInsert[0].sectionIds, ["1-1", "wc-new", "1-2", "1-3"]);
  assert.equal(sections["1-1"].number, "1-1");
  assert.equal(sections["wc-new"].number, "1-2");
  assert.equal(sections["1-2"].number, "1-3");
  assert.equal(sections["1-2"].id, "1-2");

  const beforeInsert = insertSectionId(outline, "wc-top", "1-1", "before");
  sections["wc-top"] = { id: "wc-top", number: "", title: "Top", body: "" };
  applyDisplayNumbers(beforeInsert, sections);
  assert.equal(beforeInsert[0].sectionIds[0], "wc-top");
  assert.equal(sections["wc-top"].number, "1-1");

  const childInsert = insertSectionId(outline, "wc-child", "1", "child");
  sections["wc-child"] = { id: "wc-child", number: "", title: "Child", body: "" };
  applyDisplayNumbers(childInsert, sections);
  assert.equal(childInsert[0].sectionIds.at(-1), "wc-child");
  assert.equal(sections["wc-child"].number, "1-4");
});

test("delete and cross-chapter move renumber both parents; ids stay stable", () => {
  const outline = sampleOutline();
  const sections = sectionsFrom(outline);
  const deleted = deleteSectionId(outline, "1-2");
  delete sections["1-2"];
  applyDisplayNumbers(deleted.outline, sections);
  assert.deepEqual(deleted.outline[0].sectionIds, ["1-1", "1-3"]);
  assert.equal(sections["1-3"].id, "1-3");
  assert.equal(sections["1-3"].number, "1-2");

  const moved = moveSectionId(deleted.outline, "1-3", "2", 0);
  applyDisplayNumbers(moved.outline, sections);
  assert.equal(moved.fromParentId, "1");
  assert.equal(moved.toParentId, "2");
  assert.deepEqual(moved.outline[0].sectionIds, ["1-1"]);
  assert.deepEqual(moved.outline[1].sectionIds, ["1-3", "2-1", "2-2"]);
  assert.equal(sections["1-3"].id, "1-3");
  assert.equal(sections["1-3"].number, "2-1");
  assert.equal(sections["2-1"].number, "2-2");
  assert.equal(sections["2-2"].number, "2-3");
});

test("same-chapter reorder is a move; insert shift is not", () => {
  const original = parentIndexFromOutline(sampleOutline());
  const reordered = cloneOutline(sampleOutline());
  reordered[0].sectionIds = ["1-2", "1-1", "1-3"];
  const reorderMoves = movedSectionIds(original, parentIndexFromOutline(reordered));
  assert.ok(reorderMoves.includes("1-1"));
  assert.ok(reorderMoves.includes("1-2"));
  assert.equal(reorderMoves.includes("1-3"), false);

  const inserted = insertSectionId(sampleOutline(), "wc-new", "1-1", "after");
  const insertMoves = movedSectionIds(original, parentIndexFromOutline(inserted));
  assert.deepEqual(insertMoves, []);
});

test("ACTIVE baseline seed is not mutated by outline operations", () => {
  const before = JSON.stringify(baselineDocument);
  const outline = seedWorkingOutline(baselineDocument);
  const sections: Record<string, Section> = {};
  for (const chapter of outline) {
    for (const id of chapter.sectionIds) {
      sections[id] = { id, number: id, title: id, body: "" };
    }
  }
  const next = insertSectionId(outline, "wc-x", "1-1", "before");
  applyDisplayNumbers(next, sections);
  moveSectionId(next, "1-1", "2", 0);
  deleteSectionId(next, "1-2");
  assert.equal(JSON.stringify(baselineDocument), before);
  assert.equal(baselineDocument.chapters[0].sections[0].id, "1-1");
  assert.equal(baselineDocument.chapters[0].sections[0].number, "1-1");
});

test("parent index from ACTIVE document keys tasks and assists off seed ids", () => {
  const parents = parentIndexFromDocument(baselineDocument);
  assert.equal(parents.parentOf["10-12"], "10");
  assert.ok(parents.siblings["7"]?.includes("7-3"));
});
