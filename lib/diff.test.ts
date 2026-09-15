import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { alignedDiff, compareSegments, insertRanges, mergeAlignOps, wordDiff } from "./diff.ts";

test("alignedDiff reconstructs original and draft and tags replacements", () => {
  const before = "Commanders shall test Soldiers monthly.";
  const after = "Commanders shall test Service members monthly.";
  const ops = alignedDiff(before, after);
  assert.equal(
    ops.filter((op) => op.type !== "insert").map((op) => op.text).join(""),
    before,
  );
  assert.equal(
    ops.filter((op) => op.type !== "delete").map((op) => op.text).join(""),
    after,
  );
  const { added, removed } = wordDiff(before, after);
  assert.ok(removed.some((token) => token.includes("Soldiers")));
  assert.ok(added.some((token) => token.includes("Service") || token.includes("members")));
  assert.equal(wordDiff(before, before).added.length, 0);
  assert.equal(wordDiff("", "New paragraph").added.join(" "), "New paragraph");
  assert.equal(wordDiff("Gone now", "").removed.join(" "), "Gone now");
});

test("insertRanges covers only draft tokens that differ from the original", () => {
  const before = "Keep this sentence. Change the next word here.";
  const after = "Keep this sentence. Change the next term here.";
  const ranges = insertRanges(before, after);
  assert.equal(ranges.length, 1);
  assert.equal(after.slice(ranges[0].start, ranges[0].end).trim(), "term");
  assert.deepEqual(insertRanges(after, after), []);
  assert.deepEqual(insertRanges("", ""), []);

  const added = "Prefix Keep this sentence. Change the next word here.";
  const prefixRanges = insertRanges(before, added);
  assert.equal(added.slice(prefixRanges[0].start, prefixRanges[0].end).trim(), "Prefix");
});

test("mergeAlignOps coalesces consecutive same-type tokens for Word runs", () => {
  const merged = mergeAlignOps([
    { type: "equal", text: "Keep " },
    { type: "delete", text: "old" },
    { type: "delete", text: " " },
    { type: "insert", text: "new" },
    { type: "equal", text: " text" },
  ]);
  assert.deepEqual(merged, [
    { type: "equal", text: "Keep " },
    { type: "delete", text: "old " },
    { type: "insert", text: "new" },
    { type: "equal", text: " text" },
  ]);
});

test("compareSegments marks deletions on the original side and insertions on the revised side", () => {
  const original = "Keep this sentence. Change the next word here.";
  const revised = "Keep this sentence. Change the next term here.";
  const left = compareSegments(original, revised, "original");
  const right = compareSegments(original, revised, "revised");
  assert.equal(left.filter((op) => op.type !== "insert").map((op) => op.text).join(""), original);
  assert.equal(right.filter((op) => op.type !== "delete").map((op) => op.text).join(""), revised);
  assert.ok(left.some((op) => op.type === "delete" && op.text.includes("word")));
  assert.ok(right.some((op) => op.type === "insert" && op.text.includes("term")));
  assert.equal(
    left.some((op) => op.type === "insert"),
    false,
  );
  assert.equal(
    right.some((op) => op.type === "delete"),
    false,
  );
});

test("Your draft overlay uses insertRanges; original pane stays unmarked", () => {
  const draft = readFileSync(new URL("../components/DraftEditor.tsx", import.meta.url), "utf8");
  const editor = readFileSync(new URL("../components/EditorPane.tsx", import.meta.url), "utf8");
  assert.match(draft, /insertRanges/);
  assert.match(draft, /data-draft-delta/);
  assert.match(draft, /original=/);
  assert.match(editor, /original=\{compareBody != null \? compareBody : baseline\.body\}/);
  assert.equal(editor.includes("data-draft-delta"), false);
  assert.equal(editor.includes("draft-delta"), false);
});
