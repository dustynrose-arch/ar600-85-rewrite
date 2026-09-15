import {
  AlignmentType,
  Document,
  Footer,
  Header,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { baselineDocument, flattenSections, sectionMap } from "./baseline";
import { chapterDisplayLabel, flattenOutlineSections, parentIndexFromDocument, seedWorkingOutline } from "./outline";
import {
  actionLabel,
  buildSummaryFromWorkspace,
  originalCell,
  revisedCell,
  SUMMARY_EXPORT_TITLE,
  SUMMARY_TABLE_COLUMNS,
} from "./summary-of-change";
import { BASELINE_LABEL } from "./types";
import type { Section, WorkspaceState } from "./types";
import {
  TRACK_CHANGES_COVER_LINE,
  wordFooterMark,
  wordHeaderMark,
} from "./export-stamps";
import {
  headingLine,
  newRevisionClock,
  trackedSectionParagraphs,
  flattenExportText,
} from "./revision-markup";

type DocChild = Paragraph | Table;

export type DraftExportOptions = {
  training?: boolean;
  trackChanges?: boolean;
  includeSummary?: boolean;
  includeRescinded?: boolean;
};

const DISCLAIMER =
  "DRAFT / WORKING COPY — Not an official Army publication. This document is an internal Deputy Chief of Staff, G–1 rewrite working-copy for working-group use only. It has not been authenticated under AR 25–30 (Army Publishing Program) or processed under DA Pam 25–40 (Army Publishing Program Procedures). Do not cite, implement, or distribute outside the G–1 rewrite working group. The original regulation remains ACTIVE AR 600–85 (4 October 2024, administrative revisions 27 February 2025 and 19 February 2026).";

function draftRun(text: string, opts: { bold?: boolean; size?: number; italics?: boolean } = {}) {
  return new TextRun({
    text,
    bold: opts.bold,
    italics: opts.italics,
    size: opts.size ?? 22,
    font: "Times New Roman",
    color: "8B2E1F",
  });
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

function titlePage(extraTitle?: string, training = false, trackChanges = false): Paragraph[] {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [draftRun(wordHeaderMark(training), { bold: true, size: 48 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [draftRun(extraTitle ?? "AR 600–85 Rewrite — Working Copy", { bold: true, size: 36 })],
    }),
    ...(trackChanges
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [draftRun(TRACK_CHANGES_COVER_LINE, { bold: true, size: 28 })],
          }),
        ]
      : []),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [bodyRun("The Army Substance Abuse Program", { italics: true, size: 28 })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [bodyRun("Internal G–1 rewrite working group use only", { italics: true })],
    }),
    ...(training
      ? [
          new Paragraph({
            spacing: { after: 200 },
            children: [
              draftRun(
                "TRAINING copy — practice only. This file is not the live rewrite workspace.",
                { bold: true, italics: true },
              ),
            ],
          }),
        ]
      : []),
    new Paragraph({
      spacing: { after: 200 },
      children: [bodyRun(`Original regulation (read-only): ${BASELINE_LABEL}`)],
    }),
    new Paragraph({
      spacing: { after: 400 },
      children: [bodyRun(DISCLAIMER, { italics: true, size: 20 })],
    }),
  ];
}

function summaryCell(text: string, width: number, opts: { header?: boolean; draft?: boolean } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        children: [
          opts.draft
            ? draftRun(text, { bold: opts.header, size: 18 })
            : bodyRun(text, { bold: opts.header, size: 18 }),
        ],
      }),
    ],
  });
}

function summaryTable(state: WorkspaceState): DocChild[] {
  const summary = buildSummaryFromWorkspace(state, sectionMap(), parentIndexFromDocument(baselineDocument));
  const widths = [1400, 1600, 3540, 3540];
  const children: DocChild[] = [
    new Paragraph({
      spacing: { before: 200, after: 160 },
      children: [draftRun(SUMMARY_EXPORT_TITLE, { bold: true, size: 28 })],
    }),
    new Paragraph({
      spacing: { after: 160 },
      children: [
        bodyRun(
          "This table lists only wording differences between the original regulation (read-only) and your draft. It is not an authenticated Army Publishing Directorate summary.",
          { italics: true, size: 20 },
        ),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        bodyRun(
          summary.counts.total === 0
            ? "No wording differences between the original regulation (read-only) and your draft."
            : `${summary.counts.total} change(s): ${summary.counts.revises} Revises, ${summary.counts.adds} Adds, ${summary.counts.rescinds} Rescinds, ${summary.counts.moves} Moves.`,
        ),
      ],
    }),
  ];

  if (summary.rows.length) {
    const header = new TableRow({
      tableHeader: true,
      children: SUMMARY_TABLE_COLUMNS.map((label, index) =>
        summaryCell(label, widths[index], { header: true, draft: index === 0 }),
      ),
    });
    const rows = summary.rows.map(
      (row) =>
        new TableRow({
          children: [
            summaryCell(actionLabel(row.action), widths[0], { draft: true, header: true }),
            summaryCell(row.cite, widths[1]),
            summaryCell(originalCell(row), widths[2]),
            summaryCell(revisedCell(row), widths[3]),
          ],
        }),
    );
    children.push(
      new Table({
        width: { size: widths.reduce((sum, value) => sum + value, 0), type: WidthType.DXA },
        columnWidths: widths,
        rows: [header, ...rows],
      }),
    );
  }

  children.push(
    new Paragraph({
      spacing: { before: 240, after: 200 },
      children: [
        bodyRun(
          "Structure and title changes (add, delete, move, rename) are listed as Adds, Rescinds, Moves, or Revises. Body keystrokes still produce wording rows only.",
          { italics: true, size: 20 },
        ),
      ],
    }),
  );

  return children;
}

function draftChrome(docTitle: string, children: DocChild[], training = false, trackChanges = false) {
  return new Document({
    creator: "AR 600-85 Rewrite Working Group",
    title: docTitle,
    description: DISCLAIMER,
    features: trackChanges ? { trackRevisions: true } : undefined,
    styles: {
      default: {
        document: {
          run: { font: "Times New Roman", size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  draftRun(wordHeaderMark(training), { bold: true, size: 18 }),
                  bodyRun("  ·  AR 600–85 Rewrite  ·  Internal G–1 use only  ·  ", { size: 18 }),
                  draftRun("NOT FOR IMPLEMENTATION", { bold: true, size: 18 }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  draftRun(wordFooterMark(training), { bold: true, size: 16 }),
                  bodyRun("  ·  Working copy — AR 25–30 / DA Pam 25–40 authentication not complete  ·  Page ", { size: 16 }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Times New Roman" }),
                  bodyRun(" of ", { size: 16 }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, font: "Times New Roman" }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
}

function plainSectionParagraphs(working: Section): Paragraph[] {
  const children: Paragraph[] = [
    new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [bodyRun(headingLine(working), { bold: true })],
    }),
  ];
  for (const para of working.body.split(/\n{2,}/)) {
    children.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [bodyRun(flattenExportText(para))],
      }),
    );
  }
  return children;
}

function workingCopyBody(state: WorkspaceState, opts: { trackChanges: boolean; includeRescinded: boolean }): DocChild[] {
  const trackChanges = opts.trackChanges;
  const children: DocChild[] = [
    new Paragraph({
      spacing: { before: 360, after: 200 },
      children: [draftRun("Working-copy text (DRAFT)", { bold: true, size: 28 })],
    }),
  ];
  const originalSections = sectionMap();
  const outline = state.workingOutline?.length ? state.workingOutline : seedWorkingOutline(baselineDocument);
  const clock = newRevisionClock();
  const keptIds = new Set<string>();

  for (const chapter of outline) {
    children.push(
      new Paragraph({
        spacing: { before: 360, after: 160 },
        children: [bodyRun(`${chapterDisplayLabel(chapter, outline)}. ${chapter.title}`, { bold: true, size: 28 })],
      }),
    );
    for (const working of flattenOutlineSections([chapter], state.workingSections)) {
      keptIds.add(working.id);
      if (trackChanges) {
        children.push(...trackedSectionParagraphs(originalSections[working.id], working, clock));
      } else {
        children.push(...plainSectionParagraphs(working));
      }
    }
  }

  if (trackChanges && opts.includeRescinded) {
    const rescinded = flattenSections(baselineDocument).filter((section) => !keptIds.has(section.id));
    if (rescinded.length) {
      children.push(
        new Paragraph({
          spacing: { before: 360, after: 160 },
          children: [draftRun("Rescinded from the original regulation", { bold: true, size: 28 })],
        }),
      );
      for (const section of rescinded) {
        children.push(...trackedSectionParagraphs(section, { number: "", title: "", body: "" }, clock));
      }
    }
  }

  return children;
}

export async function buildDraftDocx(state: WorkspaceState, opts: DraftExportOptions = {}): Promise<Buffer> {
  const training = opts.training === true;
  const trackChanges = opts.trackChanges === true;
  const includeSummary = opts.includeSummary !== false;
  const children: DocChild[] = [
    ...titlePage(undefined, training, trackChanges),
    ...(includeSummary ? summaryTable(state) : []),
    ...workingCopyBody(state, { trackChanges, includeRescinded: opts.includeRescinded !== false }),
  ];

  const doc = draftChrome(
    training ? "AR 600-85 Rewrite — TRAINING (DRAFT)" : "AR 600-85 Rewrite — Working Copy (DRAFT)",
    children,
    training,
    trackChanges,
  );
  return Buffer.from(await Packer.toBuffer(doc));
}

export async function buildSummaryOfChangeDocx(state: WorkspaceState, opts: { training?: boolean } = {}): Promise<Buffer> {
  const training = opts.training === true;
  const children = [...titlePage(SUMMARY_EXPORT_TITLE, training), ...summaryTable(state)];
  const doc = draftChrome(`${SUMMARY_EXPORT_TITLE}`, children, training);
  return Buffer.from(await Packer.toBuffer(doc));
}
