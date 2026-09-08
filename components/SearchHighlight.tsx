"use client";

import { splitQueryHighlights } from "@/lib/search";

export function SearchHighlight({ text, query }: { text: string; query: string }) {
  const parts = splitQueryHighlights(text, query);
  let first = true;
  return (
    <>
      {parts.map((part, index) => {
        if (!part.match) return <span key={index}>{part.text}</span>;
        const isFirst = first;
        first = false;
        return (
          <mark key={index} data-search-hit={isFirst ? "first" : "true"} className="search-hit">
            {part.text}
          </mark>
        );
      })}
    </>
  );
}

export function scrollHitIntoContainer(container: HTMLElement | null, hit: HTMLElement | null) {
  if (!container || !hit) return;
  const cRect = container.getBoundingClientRect();
  const hRect = hit.getBoundingClientRect();
  const offset = hRect.top - cRect.top - cRect.height / 3;
  container.scrollTop += offset;
}
