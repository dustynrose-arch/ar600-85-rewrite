import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { highlightSnippet } from "./search-highlight.ts";

test("highlightSnippet marks every case-insensitive hit and keeps surrounding text", () => {
  const parts = highlightSnippet("The Army army ARMY policy.", "army");
  assert.deepEqual(
    parts.filter((part) => part.match).map((part) => part.text),
    ["Army", "army", "ARMY"],
  );
  assert.equal(parts.map((part) => part.text).join(""), "The Army army ARMY policy.");
  assert.deepEqual(parts[0], { text: "The ", match: false });
});

test("highlightSnippet treats regex characters as literal query text", () => {
  const parts = highlightSnippet("See para 1-1 (a) and 1-1 (a) again.", "1-1 (a)");
  assert.deepEqual(
    parts.filter((part) => part.match).map((part) => part.text),
    ["1-1 (a)", "1-1 (a)"],
  );
});

test("highlightSnippet leaves a snippet unmarked when the query is blank or absent", () => {
  assert.deepEqual(highlightSnippet("Limited Use", "   "), [{ text: "Limited Use", match: false }]);
  assert.deepEqual(highlightSnippet("Limited Use", "rehab"), [{ text: "Limited Use", match: false }]);
});

test("outline search previews mark matched snippet text on the dark theme", () => {
  const outline = readFileSync(new URL("../components/OutlinePane.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const search = readFileSync(new URL("./search.ts", import.meta.url), "utf8");
  assert.match(outline, /highlightSnippet\(hit\.snippet, query\)/);
  assert.match(outline, /className="search-hit-mark"/);
  assert.match(outline, /Search original regulation/);
  assert.match(css, /\.search-hit-mark \{[\s\S]*#f4d56a/);
  assert.match(css, /\.search-hit-mark \{[\s\S]*#101218/);
  assert.match(search, /searchBaseline/);
  assert.match(search, /section\.body/);
});
