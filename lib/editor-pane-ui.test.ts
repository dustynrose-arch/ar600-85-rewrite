import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

function readRepoFile(relativePath: string): string {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("center pane gives the draft editor more height than the original pane", () => {
  const pane = readRepoFile("components/EditorPane.tsx");
  assert.match(pane, /grid-rows-\[minmax\(0,1fr\)_minmax\(0,2fr\)\]/);
  assert.equal(pane.includes("grid-rows-2"), false);
  assert.match(pane, /pane-scroll overflow-y-auto flex-1 min-h-0/);

  const draft = readRepoFile("components/DraftEditor.tsx");
  assert.match(draft, /id="draft-editor"/);
  assert.match(draft, /flex-1 min-h-0 h-full/);
});
