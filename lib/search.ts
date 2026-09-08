import { baselineDocument } from "./baseline";
import type { SearchHit } from "./types";

export type TextMatch = { start: number; end: number };

export type HighlightSegment = { text: string; match: boolean };

export function normalizedSearchQuery(query: string): string {
  return query.trim();
}

export function findQueryMatches(text: string, query: string): TextMatch[] {
  const needle = normalizedSearchQuery(query);
  if (!needle || !text) return [];
  const hay = text.toLowerCase();
  const needleLower = needle.toLowerCase();
  const matches: TextMatch[] = [];
  let from = 0;
  while (from <= hay.length - needleLower.length) {
    const idx = hay.indexOf(needleLower, from);
    if (idx === -1) break;
    matches.push({ start: idx, end: idx + needleLower.length });
    from = idx + needleLower.length;
  }
  return matches;
}

export function splitQueryHighlights(text: string, query: string): HighlightSegment[] {
  const matches = findQueryMatches(text, query);
  if (matches.length === 0) return [{ text, match: false }];
  const parts: HighlightSegment[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.start > cursor) parts.push({ text: text.slice(cursor, match.start), match: false });
    parts.push({ text: text.slice(match.start, match.end), match: true });
    cursor = match.end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false });
  return parts;
}

export function firstMatchIndex(text: string, query: string): number {
  return findQueryMatches(text, query)[0]?.start ?? -1;
}

export function searchBaseline(query: string, limit = 40): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];
  for (const chapter of baselineDocument.chapters) {
    for (const section of chapter.sections) {
      const hay = `${section.number} ${section.title} ${section.body}`.toLowerCase();
      const idx = hay.indexOf(q);
      if (idx === -1) continue;
      const source = `${section.number} ${section.title}. ${section.body}`;
      const start = Math.max(0, source.toLowerCase().indexOf(q) - 70);
      const snippet = `${start > 0 ? "…" : ""}${source.slice(start, start + 220)}${start + 220 < source.length ? "…" : ""}`;
      hits.push({
        sectionId: section.id,
        number: section.number,
        chapterLabel: `${chapter.label} — ${chapter.title}`,
        title: section.title,
        snippet,
      });
      if (hits.length >= limit) return hits;
    }
  }
  return hits;
}
