export type GuideBlock =
  | { type: "h1" | "h2" | "h3"; text: string; id: string }
  | { type: "p"; text: string }
  | { type: "hr" }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: GuideListItem[] }
  | { type: "table"; headers: string[]; rows: string[][] };

export type GuideListItem = {
  text: string;
  nested?: string[];
};

export function slugifyHeading(text: string): string {
  return text
    .replace(/[–—·]/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function heading(level: "h1" | "h2" | "h3", raw: string): GuideBlock {
  const text = raw.replace(/^#{1,3}\s+/, "").trim();
  return { type: level, text, id: slugifyHeading(text) };
}

function splitCells(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function isSeparatorRow(line: string): boolean {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

function isBlockStart(line: string): boolean {
  const t = line.trimStart();
  return (
    t === "---" ||
    t.startsWith("# ") ||
    t.startsWith("## ") ||
    t.startsWith("### ") ||
    t.startsWith("|") ||
    t.startsWith("- ") ||
    /^\d+\.\s/.test(t)
  );
}

export function parseGuideMarkdown(source: string): GuideBlock[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: GuideBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i += 1;
      continue;
    }
    if (line.trim() === "---") {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push(heading("h1", line));
      i += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(heading("h2", line));
      i += 1;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(heading("h3", line));
      i += 1;
      continue;
    }
    if (line.trimStart().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith("|")) {
        tableLines.push(lines[i]);
        i += 1;
      }
      const bodyLines = tableLines.filter((row) => !isSeparatorRow(row));
      if (bodyLines.length > 0) {
        const headers = splitCells(bodyLines[0]);
        const rows = bodyLines.slice(1).map(splitCells);
        blocks.push({ type: "table", headers, rows });
      }
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items: GuideListItem[] = [];
      while (i < lines.length) {
        const current = lines[i];
        const ordered = current.match(/^(\d+)\.\s+(.*)$/);
        if (ordered) {
          items.push({ text: ordered[2] });
          i += 1;
          continue;
        }
        const nested = current.match(/^\s{2,}-\s+(.*)$/);
        if (nested && items.length > 0) {
          const last = items[items.length - 1];
          last.nested = last.nested ?? [];
          last.nested.push(nested[1]);
          i += 1;
          continue;
        }
        break;
      }
      blocks.push({ type: "ol", items });
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !isBlockStart(lines[i])) {
      para.push(lines[i]);
      i += 1;
    }
    if (para.length > 0) {
      blocks.push({ type: "p", text: para.join("\n") });
    }
  }

  return blocks;
}
