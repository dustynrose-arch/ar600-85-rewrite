import { DeletedTextRun, InsertedTextRun, Paragraph, TextRun } from "docx";
import { alignedDiff, mergeAlignOps } from "./diff.ts";
import { TRACK_CHANGES_AUTHOR } from "./export-stamps.ts";

export type RevisionClock = {
  nextId: number;
  date: string;
};

export type TrackRun = TextRun | InsertedTextRun | DeletedTextRun;

export function flattenExportText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function headingLine(section: { number: string; title: string }): string {
  return flattenExportText([section.number, section.title].filter(Boolean).join(". "));
}

export function newRevisionClock(date = new Date().toISOString()): RevisionClock {
  return { nextId: 1, date };
}

function revisionMeta(clock: RevisionClock) {
  const id = clock.nextId;
  clock.nextId += 1;
  return { id, author: TRACK_CHANGES_AUTHOR, date: clock.date };
}

function bodyRun(text: string, opts: { bold?: boolean; size?: number; italics?: boolean } = {}) {
  return new TextRun({
    text,
    bold: opts.bold,
    italics: opts.italics,
    size: opts.size ?? 22,
    font: "Times New Roman",
  });
}

export function runsFromAligned(
  original: string,
  draft: string,
  clock: RevisionClock,
  opts: { bold?: boolean; size?: number; italics?: boolean } = {},
): TrackRun[] {
  const before = flattenExportText(original);
  const after = flattenExportText(draft);
  if (!before && !after) return [];
  if (before === after) return [bodyRun(after, opts)];
  const runs: TrackRun[] = [];
  for (const op of mergeAlignOps(alignedDiff(before, after))) {
    if (!op.text) continue;
    if (op.type === "equal") {
      runs.push(bodyRun(op.text, opts));
      continue;
    }
    const meta = revisionMeta(clock);
    const runOpts = {
      ...meta,
      text: op.text,
      font: "Times New Roman",
      size: opts.size ?? 22,
      bold: opts.bold,
      italics: opts.italics,
    };
    runs.push(op.type === "insert" ? new InsertedTextRun(runOpts) : new DeletedTextRun(runOpts));
  }
  return runs;
}

export function trackedParagraph(
  original: string,
  draft: string,
  clock: RevisionClock,
  opts: { bold?: boolean; size?: number; italics?: boolean; before?: number; after?: number } = {},
): Paragraph | null {
  const children = runsFromAligned(original, draft, clock, opts);
  if (!children.length) return null;
  return new Paragraph({
    spacing: { before: opts.before ?? 0, after: opts.after ?? 160 },
    children,
  });
}

export function trackedSectionParagraphs(
  original: { number: string; title: string; body: string } | undefined,
  working: { number: string; title: string; body: string },
  clock: RevisionClock,
): Paragraph[] {
  const orig = original ?? { number: "", title: "", body: "" };
  const children: Paragraph[] = [];
  const heading = trackedParagraph(headingLine(orig), headingLine(working), clock, {
    bold: true,
    before: 200,
    after: 80,
  });
  if (heading) children.push(heading);
  const body = trackedParagraph(orig.body, working.body, clock, { after: 160 });
  if (body) children.push(body);
  return children;
}
