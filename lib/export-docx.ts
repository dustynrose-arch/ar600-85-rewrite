import { Document, Footer, Header, Packer, PageNumber, Paragraph, TextRun, AlignmentType } from "docx";
import { baselineDocument } from "./baseline";
import { BASELINE_LABEL } from "./types";
import type { WorkspaceState } from "./types";

const DISCLAIMER =
  "DRAFT / WORKING COPY — Not an official Army publication. This document is an internal Deputy Chief of Staff, G–1 rewrite working-copy for working-group use only. It has not been authenticated under AR 25–30 (Army Publishing Program) or processed under DA Pam 25–40 (Army Publishing Program Procedures). Do not cite, implement, or distribute outside the G–1 rewrite working group. The locked baseline remains ACTIVE AR 600–85 (4 October 2024, administrative revisions 27 February 2025 and 19 February 2026).";

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

export async function buildDraftDocx(state: WorkspaceState): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [draftRun("DRAFT / WORKING COPY", { bold: true, size: 48 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [bodyRun("AR 600–85 Rewrite — Working Copy", { bold: true, size: 36 })],
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
    new Paragraph({
      spacing: { after: 200 },
      children: [bodyRun(`Baseline: ${BASELINE_LABEL}`)],
    }),
    new Paragraph({
      spacing: { after: 400 },
      children: [bodyRun(DISCLAIMER, { italics: true, size: 20 })],
    }),
  ];

  for (const chapter of baselineDocument.chapters) {
    children.push(
      new Paragraph({
        spacing: { before: 360, after: 160 },
        children: [bodyRun(`${chapter.label}. ${chapter.title}`, { bold: true, size: 28 })],
      }),
    );
    for (const section of chapter.sections) {
      const working = state.workingSections[section.id] ?? section;
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

  const doc = new Document({
    creator: "AR 600-85 Rewrite Working Group",
    title: "AR 600-85 Rewrite — Working Copy (DRAFT)",
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
                  draftRun("DRAFT / WORKING COPY", { bold: true, size: 18 }),
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
                  draftRun("DRAFT", { bold: true, size: 16 }),
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

  return Buffer.from(await Packer.toBuffer(doc));
}
