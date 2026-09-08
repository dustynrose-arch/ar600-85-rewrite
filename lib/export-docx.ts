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
import { baselineDocument, sectionMap } from "./baseline";
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
import type { WorkspaceState } from "./types";
import { wordFooterMark, wordHeaderMark } from "./export-stamps";

type DocChild = Paragraph | Table;

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

function titlePage(extraTitle?: string, training = false): Paragraph[] {
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

function draftChrome(docTitle: string, children: DocChild[], training = false) {
  return new Document({
    creator: "AR 600-85 Rewrite Working Group",
    title: docTitle,
    description: DISCLAIMER,
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

export async function buildDraftDocx(state: WorkspaceState, opts: { training?: boolean } = {}): Promise<Buffer> {
  const training = opts.training === true;
  const children: DocChild[] = [
    ...titlePage(undefined, training),
    ...summaryTable(state),
    new Paragraph({
      spacing: { before: 360, after: 200 },
      children: [draftRun("Working-copy text (DRAFT)", { bold: true, size: 28 })],
    }),
  ];

  const outline = state.workingOutline?.length ? state.workingOutline : seedWorkingOutline(baselineDocument);
  for (const chapter of outline) {
    children.push(
      new Paragraph({
        spacing: { before: 360, after: 160 },
        children: [bodyRun(`${chapterDisplayLabel(chapter, outline)}. ${chapter.title}`, { bold: true, size: 28 })],
      }),
    );
    for (const section of flattenOutlineSections([chapter], state.workingSections)) {
      const working = section;
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 80 },
          children: [bodyRun(`${working.number}. ${working.title}`, { bold: true })],
        }),
      );
      for (const para of working.body.split(/\n{2,}/)) {
        children.push(
          new Paragraph({
            spacing: { after: 160 },
            children: [bodyRun(para.replace(/\s+/g, " ").trim())],
          }),
        );
      }
    }
  }

  const doc = draftChrome(
    training ? "AR 600-85 Rewrite — TRAINING (DRAFT)" : "AR 600-85 Rewrite — Working Copy (DRAFT)",
    children,
    training,
  );
  return Buffer.from(await Packer.toBuffer(doc));
}

export async function buildSummaryOfChangeDocx(state: WorkspaceState, opts: { training?: boolean } = {}): Promise<Buffer> {
  const training = opts.training === true;
  const children = [...titlePage(SUMMARY_EXPORT_TITLE, training), ...summaryTable(state)];
  const doc = draftChrome(`${SUMMARY_EXPORT_TITLE}`, children, training);
  return Buffer.from(await Packer.toBuffer(doc));
}
