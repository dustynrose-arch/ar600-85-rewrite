import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import JSZip from "jszip";
import { DeletedTextRun, Document, Footer, Header, InsertedTextRun, Packer, Paragraph, TextRun } from "docx";
import { TRACK_CHANGES_COVER_LINE, wordFooterMark, wordHeaderMark } from "./export-stamps.ts";
import { newRevisionClock, trackedSectionParagraphs } from "./revision-markup.ts";

const exportDocx = readFileSync(new URL("./export-docx.ts", import.meta.url), "utf8");
const revisionMarkup = readFileSync(new URL("./revision-markup.ts", import.meta.url), "utf8");
const trainingSwitch = readFileSync(new URL("../components/TrainingSwitch.tsx", import.meta.url), "utf8");
const MARKER = "WGDELTAWORD";

function xmlText(xml: string): string {
  return [...xml.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)].map((match) => match[1]).join("");
}

function xmlAllText(xml: string): string {
  return [...xml.matchAll(/<w:(?:t|delText)\b[^>]*>([\s\S]*?)<\/w:(?:t|delText)>/g)].map((match) => match[1]).join("");
}

async function headerFooterText(zip: JSZip): Promise<string> {
  let text = "";
  for (const name of Object.keys(zip.files)) {
    if (!name.startsWith("word/header") && !name.startsWith("word/footer")) continue;
    if (!name.endsWith(".xml")) continue;
    text += xmlText(await zip.file(name)!.async("string"));
  }
  return text;
}

test("training Word footer carries TRAINING and DRAFT; live footer stays DRAFT-only", async () => {
  assert.equal(wordFooterMark(true), "TRAINING / DRAFT");
  assert.match(wordFooterMark(true), /TRAINING/);
  assert.match(wordFooterMark(true), /DRAFT/);
  assert.equal(wordFooterMark(false), "DRAFT");
  assert.doesNotMatch(wordFooterMark(false), /TRAINING/);
  assert.equal(wordHeaderMark(true), "TRAINING / DRAFT / WORKING COPY");
  assert.equal(wordHeaderMark(false), "DRAFT / WORKING COPY");

  assert.match(exportDocx, /draftRun\(wordFooterMark\(training\)/);
  assert.match(exportDocx, /draftRun\(wordHeaderMark\(training\)/);
  assert.match(exportDocx, /TRAINING copy — practice only/);
  assert.equal(
    /footers:[\s\S]*?draftRun\("DRAFT"/.test(exportDocx),
    false,
    "Training footer must not be a hard-coded DRAFT-only run",
  );

  const packed = new Document({
    sections: [
      {
        footers: {
          default: new Footer({
            children: [new Paragraph({ children: [new TextRun({ text: wordFooterMark(true) })] })],
          }),
        },
        children: [new Paragraph({ children: [new TextRun({ text: "body" })] })],
      },
    ],
  });
  const zip = await JSZip.loadAsync(Buffer.from(await Packer.toBuffer(packed)));
  const footerNames = Object.keys(zip.files).filter((name) => name.startsWith("word/footer") && name.endsWith(".xml"));
  assert.ok(footerNames.length > 0, "packed docx has a footer part");
  let footerText = "";
  for (const name of footerNames) {
    footerText += xmlText(await zip.file(name)!.async("string"));
  }
  assert.match(footerText, /TRAINING \/ DRAFT/);
});

test("Leave Training and Reset Cancel use filled high-contrast buttons", () => {
  const leaveIdx = trainingSwitch.indexOf("Leave Training");
  const leaveBlock = trainingSwitch.slice(Math.max(0, leaveIdx - 400), leaveIdx);
  assert.match(leaveBlock, /bg-army-gold/);
  assert.match(leaveBlock, /text-army-black/);
  assert.match(leaveBlock, /border-army-cream/);
  assert.equal(leaveBlock.includes("bg-army-cream"), false, "Cream fill on the dark header is too pale");

  const confirmBlock = trainingSwitch.slice(trainingSwitch.indexOf("CONFIRM RESET"));
  assert.match(confirmBlock, /bg-army-ink text-army-cream/);
  assert.match(confirmBlock, /border-2 border-army-black/);
  assert.match(confirmBlock, /bg-army-rust text-white/);
  assert.equal(confirmBlock.includes("border-army-black/40"), false);
  assert.equal(confirmBlock.includes('bg-white"'), false);
});

test("docx library emits OOXML w:ins / w:del / w:delText revision wrappers", async () => {
  const packed = new Document({
    features: { trackRevisions: true },
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "Keep " }),
              new DeletedTextRun({ id: 1, author: "WG", date: "2026-09-15T00:00:00Z", text: "Soldiers" }),
              new InsertedTextRun({ id: 2, author: "WG", date: "2026-09-15T00:00:00Z", text: "Service members" }),
            ],
          }),
        ],
      },
    ],
  });
  const zip = await JSZip.loadAsync(Buffer.from(await Packer.toBuffer(packed)));
  const documentXml = await zip.file("word/document.xml")!.async("string");
  const settingsXml = (await zip.file("word/settings.xml")?.async("string")) ?? "";
  assert.match(documentXml, /<w:ins\b/);
  assert.match(documentXml, /<w:del\b/);
  assert.match(documentXml, /<w:delText\b/);
  assert.match(documentXml, /Soldiers/);
  assert.match(documentXml, /Service members/);
  assert.match(settingsXml, /w:trackRevisions/);
});

test("plain Word export stays unmarked; Track Changes adds stamps, cover line, and revision markup", async () => {
  assert.equal(TRACK_CHANGES_COVER_LINE, "change-markup working draft for WG review");
  assert.match(revisionMarkup, /InsertedTextRun/);
  assert.match(revisionMarkup, /DeletedTextRun/);
  assert.match(exportDocx, /TRACK_CHANGES_COVER_LINE/);
  assert.match(exportDocx, /features: trackChanges \? \{ trackRevisions: true \}/);
  assert.match(exportDocx, /titlePage\(undefined, training, trackChanges\)/);
  assert.match(exportDocx, /trackedSectionParagraphs/);
  assert.match(exportDocx, /plainSectionParagraphs/);
  assert.equal(exportDocx.includes("InsertedTextRun"), false, "plain export-docx path must not emit revision runs itself");

  const original = "This regulation tests Soldiers of all components monthly.";
  const draft = `This regulation tests Service members of all components monthly. ${MARKER}`;
  const clock = newRevisionClock("2026-09-15T00:00:00Z");
  const tracked = trackedSectionParagraphs(
    { number: "1-1", title: "Purpose", body: original },
    { number: "1-1", title: "Purpose", body: draft },
    clock,
  );

  const trackDoc = new Document({
    features: { trackRevisions: true },
    sections: [
      {
        headers: {
          default: new Header({
            children: [new Paragraph({ children: [new TextRun({ text: wordHeaderMark(false) })] })],
          }),
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({ children: [new TextRun({ text: wordFooterMark(false) })] })],
          }),
        },
        children: [
          new Paragraph({ children: [new TextRun({ text: TRACK_CHANGES_COVER_LINE })] }),
          ...tracked,
        ],
      },
    ],
  });
  const trainingTrackDoc = new Document({
    features: { trackRevisions: true },
    sections: [
      {
        headers: {
          default: new Header({
            children: [new Paragraph({ children: [new TextRun({ text: wordHeaderMark(true) })] })],
          }),
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({ children: [new TextRun({ text: wordFooterMark(true) })] })],
          }),
        },
        children: [
          new Paragraph({ children: [new TextRun({ text: TRACK_CHANGES_COVER_LINE })] }),
          new Paragraph({ children: [new TextRun({ text: "TRAINING copy — practice only. This file is not the live rewrite workspace." })] }),
          ...trackedSectionParagraphs(
            { number: "1-1", title: "Purpose", body: original },
            { number: "1-1", title: "Purpose", body: draft },
            newRevisionClock("2026-09-15T00:00:00Z"),
          ),
        ],
      },
    ],
  });
  const plainDoc = new Document({
    sections: [
      {
        headers: {
          default: new Header({
            children: [new Paragraph({ children: [new TextRun({ text: wordHeaderMark(false) })] })],
          }),
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({ children: [new TextRun({ text: wordFooterMark(false) })] })],
          }),
        },
        children: [new Paragraph({ children: [new TextRun({ text: draft })] })],
      },
    ],
  });

  const track = await JSZip.loadAsync(Buffer.from(await Packer.toBuffer(trackDoc)));
  const trainingTrack = await JSZip.loadAsync(Buffer.from(await Packer.toBuffer(trainingTrackDoc)));
  const plain = await JSZip.loadAsync(Buffer.from(await Packer.toBuffer(plainDoc)));

  const plainXml = await plain.file("word/document.xml")!.async("string");
  const trackXml = await track.file("word/document.xml")!.async("string");
  const trainingXml = await trainingTrack.file("word/document.xml")!.async("string");
  const plainSettings = (await plain.file("word/settings.xml")?.async("string")) ?? "";
  const trackSettings = (await track.file("word/settings.xml")?.async("string")) ?? "";

  assert.match(xmlText(plainXml), new RegExp(MARKER));
  assert.equal(plainXml.includes("<w:ins"), false, "plain export must not wrap body in w:ins");
  assert.equal(plainXml.includes("<w:del"), false, "plain export must not wrap body in w:del");
  assert.equal(xmlText(plainXml).includes(TRACK_CHANGES_COVER_LINE), false);
  assert.doesNotMatch(plainSettings, /w:trackRevisions/);

  assert.match(trackXml, /<w:ins\b/);
  assert.match(trackXml, /<w:del\b/);
  assert.match(trackXml, /<w:delText\b/);
  assert.match(trackXml, new RegExp(`<w:ins[\\s\\S]*${MARKER}`));
  assert.match(xmlAllText(trackXml), /Soldiers/);
  assert.match(xmlAllText(trackXml), /Service members/);
  assert.match(xmlText(trackXml), new RegExp(TRACK_CHANGES_COVER_LINE));
  assert.match(trackSettings, /w:trackRevisions/);

  const liveMarks = await headerFooterText(track);
  assert.match(liveMarks, /DRAFT \/ WORKING COPY/);
  assert.match(liveMarks, /DRAFT/);
  assert.doesNotMatch(liveMarks, /TRAINING/);

  const trainingMarks = await headerFooterText(trainingTrack);
  assert.match(trainingMarks, /TRAINING \/ DRAFT \/ WORKING COPY/);
  assert.match(trainingMarks, /TRAINING \/ DRAFT/);
  assert.match(xmlText(trainingXml), /TRAINING copy — practice only/);
  assert.match(xmlText(trainingXml), new RegExp(TRACK_CHANGES_COVER_LINE));
});
