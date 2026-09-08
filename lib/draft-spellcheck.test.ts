import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const draftEditor = readFileSync(new URL("../components/DraftEditor.tsx", import.meta.url), "utf8");
const editorPane = readFileSync(new URL("../components/EditorPane.tsx", import.meta.url), "utf8");
const workbench = readFileSync(new URL("../components/Workbench.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("draft textarea is not a live-defaultValue field (Chrome spellcheck)", () => {
  assert.equal(
    draftEditor.includes("defaultValue={value}"),
    false,
    "Passing the live draft as defaultValue makes React rewrite textarea.defaultValue on every keystroke; Chrome then skips native spellcheck underlines",
  );
  assert.equal(draftEditor.includes("value={value}"), false);
  assert.equal(
    draftEditor.includes("el.value = value"),
    false,
    "Assigning textarea.value from the live draft prop clears Chrome spelling markers",
  );
  assert.match(draftEditor, /seedRef/);
  assert.match(draftEditor, /defaultValue=\{seedRef\.current\.text\}/);
  assert.match(draftEditor, /spellCheck=\{true\}/);
  assert.match(draftEditor, /lang="en-US"/);
});

test("original regulation pane stays spellcheck off and CSS does not restyle ::spelling-error", () => {
  assert.match(editorPane, /spellCheck=\{false\}/);
  assert.match(editorPane, /data-spellcheck="disabled"/);
  assert.equal(
    css.includes("::spelling-error"),
    false,
    "Author ::spelling-error rules replace Chrome's native marker and often paint nothing on textarea",
  );
  assert.equal(css.includes("::grammar-error"), false);
});

test("autosave workingSections updates do not reset the draft textarea", () => {
  assert.match(workbench, /selectedId !== draftSectionId/);
  assert.equal(
    workbench.includes("setDraft(state.workingSections[selectedId]"),
    false,
    "setDraft must not reload from workingSections on every applyState/autosave",
  );
});
