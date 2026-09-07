import type { DiffHunk, Section, WorkingSection } from "./types";
import { flattenSections } from "./baseline";

function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((token) => token.length > 0);
}

export function wordDiff(before: string, after: string): { added: string[]; removed: string[] } {
  const a = tokenize(before);
  const b = tokenize(after);
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const added: string[] = [];
  const removed: string[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      if (a[i].trim()) removed.push(a[i]);
      i += 1;
    } else {
      if (b[j].trim()) added.push(b[j]);
      j += 1;
    }
  }
  while (i < n) {
    if (a[i].trim()) removed.push(a[i]);
    i += 1;
  }
  while (j < m) {
    if (b[j].trim()) added.push(b[j]);
    j += 1;
  }
  return { added, removed };
}

export function buildDiffs(
  current: Record<string, WorkingSection | Section>,
  compare: Record<string, Section>,
): DiffHunk[] {
  return flattenSections().map((baseline) => {
    const left = compare[baseline.id]?.body ?? baseline.body;
    const right = current[baseline.id]?.body ?? baseline.body;
    const { added, removed } = wordDiff(left, right);
    return {
      sectionId: baseline.id,
      number: baseline.number,
      title: baseline.title,
      baseline: left,
      current: right,
      added,
      removed,
      unchanged: left === right,
    };
  });
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
