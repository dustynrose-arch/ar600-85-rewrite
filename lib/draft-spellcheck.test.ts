import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createDraftSpellEngine } from "./draft-spell-engine.ts";
import {
  extraKnownWords,
  preserveWordShape,
  replaceWordAt,
  shouldCheckWord,
  wordAtOffset,
} from "./draft-spellcheck.ts";

const draftEditor = readFileSync(new URL("../components/DraftEditor.tsx", import.meta.url), "utf8");
const editorPane = readFileSync(new URL("../components/EditorPane.tsx", import.meta.url), "utf8");
const workbench = readFileSync(new URL("../components/Workbench.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const aff = readFileSync(new URL("../public/spellcheck/en.aff", import.meta.url), "utf8");
const dic = readFileSync(new URL("../public/spellcheck/en.dic", import.meta.url), "utf8");
const engine = createDraftSpellEngine(aff, dic);

test("draft textarea stays uncontrolled and hosts the in-app overlay", () => {
  assert.equal(draftEditor.includes("defaultValue={value}"), false);
  assert.equal(draftEditor.includes("value={value}"), false);
  assert.equal(
    draftEditor.includes("el.value = value"),
    false,
    "Assigning textarea.value from the live draft prop resets caret and spell marks",
  );
  assert.match(draftEditor, /seedRef/);
  assert.match(draftEditor, /defaultValue=\{seedRef\.current\.text\}/);
  assert.match(draftEditor, /data-spellcheck="app"/);
  assert.match(draftEditor, /data-spell-overlay="draft"/);
  assert.match(draftEditor, /data-misspelled=/);
  assert.match(draftEditor, /data-spell-menu/);
  assert.match(draftEditor, /spellCheck=\{false\}/);
  assert.match(draftEditor, /Undo/);
  assert.match(draftEditor, /Save/);
  assert.match(draftEditor, /onContextMenu=\{openSpellMenu\}/);
});

test("original regulation pane stays spellcheck off and CSS does not restyle ::spelling-error", () => {
  assert.match(editorPane, /spellCheck=\{false\}/);
  assert.match(editorPane, /data-spellcheck="disabled"/);
  assert.equal(editorPane.includes("data-spell-overlay"), false);
  assert.equal(
    css.includes("::spelling-error"),
    false,
    "Author ::spelling-error rules replace Chrome's native marker and often paint nothing on textarea",
  );
  assert.equal(css.includes("::grammar-error"), false);
  assert.match(css, /\.draft-misspelled/);
});

test("autosave workingSections updates do not reset the draft textarea", () => {
  assert.match(workbench, /selectedId !== draftSectionId/);
  assert.equal(
    workbench.includes("setDraft(state.workingSections[selectedId]"),
    false,
    "setDraft must not reload from workingSections on every applyState/autosave",
  );
});

test("skip acronyms, citations, and internal-capital tokens", () => {
  assert.equal(shouldCheckWord("ASAP"), false);
  assert.equal(shouldCheckWord("DTC"), false);
  assert.equal(shouldCheckWord("DoD"), false);
  assert.equal(shouldCheckWord("a"), false);
  assert.equal(shouldCheckWord("skioiashdf"), true);
  assert.equal(shouldCheckWord("neligible"), true);
  assert.equal(shouldCheckWord("Soldiers"), true);
});

test("wordAtOffset and replaceWordAt keep surrounding draft text", () => {
  const text = "other personnel skioiashdf neligible";
  const hit = wordAtOffset(text, text.indexOf("skioiashdf") + 3);
  assert.ok(hit);
  assert.equal(hit.word, "skioiashdf");
  assert.equal(replaceWordAt(text, hit.start, hit.end, "eligible"), "other personnel eligible neligible");
  assert.equal(preserveWordShape("Skioiashdf", "eligible"), "Eligible");
});

test("in-app engine flags Dustyn FAIL tokens and accepts regulation words", () => {
  assert.equal(engine.isMisspelled("skioiashdf"), true);
  assert.equal(engine.isMisspelled("neligible"), true);
  assert.equal(engine.isMisspelled("personnel"), false);
  assert.equal(engine.isMisspelled("eligible"), false);
  assert.equal(engine.isMisspelled("Soldiers"), false);
  assert.equal(engine.isMisspelled("ASAP"), false);
  assert.equal(engine.isMisspelled("ineligible"), false);
  const suggestions = engine.suggestions("neligible");
  assert.ok(
    suggestions.some((word) => word.toLowerCase() === "eligible" || word.toLowerCase() === "ineligible"),
    `expected eligible/ineligible in ${JSON.stringify(suggestions)}`,
  );
});

test("glossary extras are known words", () => {
  const extras = extraKnownWords();
  assert.ok(extras.includes("asap"));
  assert.equal(engine.isMisspelled("urinalysis"), false);
});
