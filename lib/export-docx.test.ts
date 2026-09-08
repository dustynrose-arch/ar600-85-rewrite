import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import JSZip from "jszip";
import { Document, Footer, Packer, Paragraph, TextRun } from "docx";
import { wordFooterMark, wordHeaderMark } from "./export-stamps.ts";

const exportDocx = readFileSync(new URL("./export-docx.ts", import.meta.url), "utf8");
const trainingSwitch = readFileSync(new URL("../components/TrainingSwitch.tsx", import.meta.url), "utf8");

function xmlText(xml: string): string {
  return [...xml.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)].map((match) => match[1]).join("");
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
