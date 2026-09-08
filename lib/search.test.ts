import assert from "node:assert/strict";
import { test } from "node:test";
import {
  findQueryMatches,
  firstMatchIndex,
  searchBaseline,
  splitQueryHighlights,
} from "./search.ts";

test("findQueryMatches is case-insensitive and preserves original slice bounds", () => {
  const text = "The Secretary of Defense and the Defense Health Agency.";
  assert.deepEqual(findQueryMatches(text, "defense"), [
    { start: 18, end: 26 },
    { start: 35, end: 43 },
  ]);
  assert.equal(text.slice(18, 26), "Defense");
  assert.equal(text.slice(35, 43), "Defense");
});

test("splitQueryHighlights keeps original casing on matched slices", () => {
  const parts = splitQueryHighlights("defense Defense DEFENSE", "DeFeNsE");
  assert.deepEqual(
    parts.filter((part) => part.match).map((part) => part.text),
    ["defense", "Defense", "DEFENSE"],
  );
});

test("empty or whitespace query yields no matches and does not split the body", () => {
  assert.deepEqual(findQueryMatches("Defense policy", "   "), []);
  assert.deepEqual(splitQueryHighlights("Defense policy", ""), [{ text: "Defense policy", match: false }]);
});

test("literal queries with regex metacharacters still match with indexOf", () => {
  const text = "See para 1-1. Next.";
  assert.deepEqual(findQueryMatches(text, "1-1."), [{ start: 9, end: 13 }]);
  assert.equal(splitQueryHighlights(text, "1-1.")[1]?.text, "1-1.");
});

test("firstMatchIndex returns -1 when the visible body has no hit", () => {
  assert.equal(firstMatchIndex("No such term here", "defense"), -1);
  assert.equal(firstMatchIndex("Army Defense program", "defense"), 5);
});

test("searchBaseline still returns sections for defense", () => {
  const hits = searchBaseline("defense", 10);
  assert.ok(hits.length >= 1);
  assert.ok(hits.every((hit) => Boolean(hit.sectionId)));
});
