import type { DiffHunk, Section, WorkingSection } from "./types";

export type AlignOp = {
  type: "equal" | "insert" | "delete";
  text: string;
};

export type InsertRange = {
  start: number;
  end: number;
};

const MAX_LCS_CELLS = 1_500_000;

function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((token) => token.length > 0);
}

function diffTokens(a: string[], b: string[]): AlignOp[] {
  const n = a.length;
  const m = b.length;
  if (n === 0 && m === 0) return [];
  if (n === 0) return b.map((text) => ({ type: "insert" as const, text }));
  if (m === 0) return a.map((text) => ({ type: "delete" as const, text }));
  if (n * m > MAX_LCS_CELLS) {
    return [
      ...a.map((text) => ({ type: "delete" as const, text })),
      ...b.map((text) => ({ type: "insert" as const, text })),
    ];
  }

  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops: AlignOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: "equal", text: a[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "delete", text: a[i] });
      i += 1;
    } else {
      ops.push({ type: "insert", text: b[j] });
      j += 1;
    }
  }
  while (i < n) {
    ops.push({ type: "delete", text: a[i] });
    i += 1;
  }
  while (j < m) {
    ops.push({ type: "insert", text: b[j] });
    j += 1;
  }
  return ops;
}

export function alignedDiff(before: string, after: string): AlignOp[] {
  if (before === after) return before ? [{ type: "equal", text: before }] : [];
  const a = tokenize(before);
  const b = tokenize(after);
  let prefix = 0;
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix += 1;
  let suffix = 0;
  while (
    suffix < a.length - prefix &&
    suffix < b.length - prefix &&
    a[a.length - 1 - suffix] === b[b.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  const head = a.slice(0, prefix).map((text) => ({ type: "equal" as const, text }));
  const mid = diffTokens(a.slice(prefix, a.length - suffix), b.slice(prefix, b.length - suffix));
  const tail = a.slice(a.length - suffix).map((text) => ({ type: "equal" as const, text }));
  return [...head, ...mid, ...tail];
}

export function mergeAlignOps(ops: AlignOp[]): AlignOp[] {
  const merged: AlignOp[] = [];
  for (const op of ops) {
    const last = merged[merged.length - 1];
    if (last && last.type === op.type) last.text += op.text;
    else merged.push({ type: op.type, text: op.text });
  }
  return merged;
}

export function insertRanges(before: string, after: string): InsertRange[] {
  if (before === after || !after) return [];
  const ranges: InsertRange[] = [];
  let offset = 0;
  for (const op of alignedDiff(before, after)) {
    if (op.type === "delete") continue;
    if (op.type === "insert" && op.text.trim()) {
      const start = offset;
      const end = offset + op.text.length;
      const last = ranges[ranges.length - 1];
      if (last && after.slice(last.end, start).trim() === "") last.end = end;
      else ranges.push({ start, end });
    }
    offset += op.text.length;
  }
  return ranges;
}

export function wordDiff(before: string, after: string): { added: string[]; removed: string[] } {
  const added: string[] = [];
  const removed: string[] = [];
  for (const op of alignedDiff(before, after)) {
    if (op.type === "insert" && op.text.trim()) added.push(op.text);
    if (op.type === "delete" && op.text.trim()) removed.push(op.text);
  }
  return { added, removed };
}

function sortKey(section: { number: string; title: string; id: string }): string {
  return `${section.number}\t${section.title}\t${section.id}`;
}

export function buildDiffs(
  current: Record<string, WorkingSection | Section>,
  compare: Record<string, Section>,
): DiffHunk[] {
  const ids = new Set([...Object.keys(current), ...Object.keys(compare)]);
  return [...ids]
    .map((id) => {
      const leftSection = compare[id];
      const rightSection = current[id];
      const meta = rightSection ?? leftSection;
      const left = leftSection?.body ?? "";
      const right = rightSection?.body ?? "";
      const { added, removed } = wordDiff(left, right);
      return {
        sectionId: id,
        number: meta?.number ?? id,
        title: meta?.title ?? "",
        baseline: left,
        current: right,
        added,
        removed,
        unchanged: left === right,
        _sort: sortKey({ id, number: meta?.number ?? id, title: meta?.title ?? "" }),
      };
    })
    .sort((a, b) => a._sort.localeCompare(b._sort, undefined, { numeric: true }))
    .map(({ _sort: _unused, ...hunk }) => hunk);
}

export function summarizeDiffs(hunks: DiffHunk[]): string[] {
  const changed = hunks.filter((hunk) => !hunk.unchanged);
  if (changed.length === 0) {
    return ["No wording differences versus the selected comparison copy."];
  }
  const bullets = changed.slice(0, 40).map((hunk) => {
    const addPreview = hunk.added.slice(0, 12).join(" ");
    const remPreview = hunk.removed.slice(0, 12).join(" ");
    const parts = [`${hunk.number} ${hunk.title}`];
    if (remPreview) parts.push(`removed “${remPreview}${hunk.removed.length > 12 ? "…" : ""}”`);
    if (addPreview) parts.push(`added “${addPreview}${hunk.added.length > 12 ? "…" : ""}”`);
    return parts.join(" — ");
  });
  if (changed.length > 40) {
    bullets.push(`…and ${changed.length - 40} additional changed paragraph(s).`);
  }
  bullets.unshift(`${changed.length} paragraph(s) differ from the comparison copy.`);
  return bullets;
}
