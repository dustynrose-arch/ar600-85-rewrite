export type SnippetPart = {
  text: string;
  match: boolean;
};

/** Case-insensitive slices of a preview snippet. Unmatched text stays plain. */
export function highlightSnippet(snippet: string, query: string): SnippetPart[] {
  const q = query.trim();
  if (!q) return [{ text: snippet, match: false }];
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(escaped, "gi");
  const parts: SnippetPart[] = [];
  let last = 0;
  for (const found of snippet.matchAll(re)) {
    const index = found.index ?? 0;
    if (index > last) parts.push({ text: snippet.slice(last, index), match: false });
    parts.push({ text: found[0], match: true });
    last = index + found[0].length;
  }
  if (last < snippet.length) parts.push({ text: snippet.slice(last), match: false });
  if (parts.length === 0) return [{ text: snippet, match: false }];
  return parts;
}
