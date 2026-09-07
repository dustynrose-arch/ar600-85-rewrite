import { baselineDocument } from "./baseline";
import type { SearchHit } from "./types";

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
