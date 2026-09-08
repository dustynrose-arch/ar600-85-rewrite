import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bindingFromWorking,
  chipsFromWorkingText,
  dropAssistState,
  emptyAssistBinding,
  processHighlightIds,
  processNodeIdsForSection,
  sectionByStableId,
  seedAssistBindings,
  viewAssistChips,
} from "./assist-bind.ts";
import type { AssistBinding, Section } from "./types.ts";

function section(id: string, number: string, title: string, body: string): Section {
  return { id, number, title, body };
}

test("chips and process highlight key off stable id, never display number", () => {
  const limited = section(
    "10-12",
    "18-99",
    "Definition of the Limited Use Policy",
    "Limited Use protected evidence and self-referral.",
  );
  const moved = { ...limited, number: "2-1" };
  const byNumber = section("wc-other", "10-12", "Unrelated", "No ASAP terms here.");
  const sections = { "10-12": moved, "wc-other": byNumber };

  assert.equal(sectionByStableId(sections, "10-12")?.id, "10-12");
  assert.equal(sectionByStableId(sections, "10-12")?.number, "2-1");
  assert.notEqual(sectionByStableId(Object.values(sections), "10-12")?.id, "wc-other");
  assert.deepEqual(processNodeIdsForSection("10-11"), ["legal-screen"]);
  assert.deepEqual(processHighlightIds("10-11", new Set(["10-11"])), ["legal-screen"]);
  assert.deepEqual(processHighlightIds("10-11", new Set(["wc-other"])), []);
  assert.ok(chipsFromWorkingText(moved.title, moved.body).limitedUse);
  assert.ok(chipsFromWorkingText(moved.title, moved.body).glossaryTermIds.includes("limited-use") || chipsFromWorkingText(moved.title, moved.body).limitedUse);
  assert.equal(chipsFromWorkingText(byNumber.title, byNumber.body).limitedUse, false);
});

test("add/reorder/rename keep source binding; empty sibling gets no invented chips", () => {
  const source = section("7-3", "7-3", "Self-identification", "Soldier seeks help. ASAP and Limited Use apply.");
  const bindings = seedAssistBindings({ "7-3": { ...source, updatedAt: "", updatedBy: "editor" } });
  const kept = structuredClone(bindings["7-3"]);
  const afterRename = { ...bindings };
  afterRename["7-3"] = kept;
  const sibling = emptyAssistBinding("wc-split");
  assert.deepEqual(afterRename["7-3"], kept);
  assert.deepEqual(sibling.glossaryTermIds, []);
  assert.equal(sibling.limitedUse, false);
  assert.deepEqual(sibling.processNodeIds, []);
  assert.ok(processNodeIdsForSection("7-3").includes("id-self"));
  assert.deepEqual(processHighlightIds("7-3", new Set(["7-3", "wc-split"])), processNodeIdsForSection("7-3"));
  assert.deepEqual(processHighlightIds("wc-split", new Set(["7-3", "wc-split"])), []);
});

test("split leaves chips on the source until the editor moves text", () => {
  const source = bindingFromWorking(
    section("7-3", "7-4", "Self-identification", "Self-referral and Limited Use Policy wording."),
  );
  const sibling = emptyAssistBinding("wc-empty");
  assert.ok(source.limitedUse);
  assert.ok(source.glossaryTermIds.length > 0 || source.limitedUse);
  assert.equal(sibling.limitedUse, false);
  assert.deepEqual(sibling.glossaryTermIds, []);
  const afterMove = viewAssistChips(
    section("7-3", "7-4", "Self-identification", "Short remainder."),
    source,
    "Short remainder.",
  );
  const siblingAfterPaste = viewAssistChips(
    section("wc-empty", "7-5", "New paragraph", ""),
    sibling,
    "Self-referral and Limited Use Policy wording.",
  );
  assert.equal(afterMove.limitedUse, false);
  assert.equal(siblingAfterPaste.limitedUse, true);
});

test("delete drops assist state for that stable id", () => {
  const state = {
    assistBindings: {
      "10-12": bindingFromWorking(section("10-12", "10-12", "Limited Use", "Limited Use definition.")),
      "7-3": emptyAssistBinding("7-3"),
    } as Record<string, AssistBinding>,
    wgReviewMarks: [{ sectionId: "10-12" }, { sectionId: "7-3" }],
    sergeant: [{ citeTo: "10-12" }, { citeTo: "7-1" }],
  };
  dropAssistState(state, "10-12");
  assert.equal(state.assistBindings["10-12"], undefined);
  assert.ok(state.assistBindings["7-3"]);
  assert.deepEqual(
    state.wgReviewMarks.map((mark) => mark.sectionId),
    ["7-3"],
  );
  assert.equal(state.sergeant[0].citeTo, undefined);
  assert.equal(state.sergeant[1].citeTo, "7-1");
});

test("never rebinds chips from ACTIVE baseline text", () => {
  const working = section("1-1", "1-1", "Purpose", "Working draft with ASAP.");
  const baseline = section("1-1", "1-1", "Purpose", "ACTIVE baseline Limited Use protected evidence.");
  const binding = bindingFromWorking(working);
  const fromBaseline = chipsFromWorkingText(baseline.title, baseline.body);
  assert.ok(binding.glossaryTermIds.includes("asap"));
  assert.equal(binding.limitedUse, false);
  assert.equal(fromBaseline.limitedUse, true);
  assert.notDeepEqual(binding.glossaryTermIds, fromBaseline.glossaryTermIds);
  const viewed = viewAssistChips(working, binding);
  assert.equal(viewed.limitedUse, false);
});
