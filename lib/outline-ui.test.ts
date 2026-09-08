import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { insertSectionId } from "./outline.ts";
import type { StructurePosition, WorkingOutlineChapter } from "./types.ts";

function readRepoFile(relativePath: string): string {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("Editor outline UI does not surface Add child; before/after remain", () => {
  const pane = readRepoFile("components/OutlinePane.tsx");
  assert.equal(/Add child/i.test(pane), false);
  assert.equal(pane.includes('"child"'), false);
  assert.match(pane, /Add before/);
  assert.match(pane, /Add after/);
  assert.match(pane, /openAdd\(selected\.id, "before"\)/);
  assert.match(pane, /openAdd\(selected\.id, "after"\)/);

  const guide = readRepoFile("components/UserGuide.tsx");
  const walkthrough = readRepoFile("components/GuideWalkthrough.tsx");
  assert.equal(/Add child/i.test(guide), false);
  assert.equal(/Add child/i.test(walkthrough), false);
});

test("search bar has a clear control that empties the query", () => {
  const pane = readRepoFile("components/OutlinePane.tsx");
  assert.match(pane, /aria-label="Clear search"/);
  assert.match(pane, /onQuery\(""\)/);
  assert.match(pane, /aria-label="Search original regulation"/);

  const workbench = readRepoFile("components/Workbench.tsx");
  assert.match(workbench, /searchQuery=\{query\}/);
  assert.match(workbench, /setHits\(\[\]\)/);

  const editor = readRepoFile("components/EditorPane.tsx");
  assert.match(editor, /searchQuery/);
  assert.match(editor, /SearchHighlight/);
});

test("structure API still accepts child position on chapter targets", () => {
  const child: StructurePosition = "child";
  const outline: WorkingOutlineChapter[] = [
    { id: "1", kind: "chapter", title: "General", sectionIds: ["1-1", "1-2"] },
  ];
  const next = insertSectionId(outline, "wc-child", "1", child);
  assert.equal(next[0].sectionIds.at(-1), "wc-child");
  assert.deepEqual(next[0].sectionIds, ["1-1", "1-2", "wc-child"]);
});
