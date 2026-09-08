import assert from "node:assert/strict";
import { test } from "node:test";
import JSZip from "jszip";
import { extractDocument } from "./document-extract.ts";

async function miniDocx(paragraphs: string[], pageBreakAfter = -1): Promise<Buffer> {
  const runs = paragraphs
    .map((text, index) => {
      const breakXml = index === pageBreakAfter ? `<w:p><w:r><w:br w:type="page"/></w:r></w:p>` : "";
      return `<w:p><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>${breakXml}`;
    })
    .join("");
  const zip = new JSZip();
  zip.file(
    "word/document.xml",
    `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${runs}</w:body></w:document>`,
  );
  return Buffer.from(await zip.generateAsync({ type: "uint8array" }));
}

async function miniPptx(slides: string[]): Promise<Buffer> {
  const zip = new JSZip();
  slides.forEach((text, index) => {
    zip.file(
      `ppt/slides/slide${index + 1}.xml`,
      `<?xml version="1.0"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:t>${text}</a:t></p:sld>`,
    );
  });
  return Buffer.from(await zip.generateAsync({ type: "uint8array" }));
}

test("extracts docx pages and pptx slides", async () => {
  const docx = await extractDocument(
    "policy.docx",
    await miniDocx(["Para 4-5 on page one.", "Second page after break."], 0),
  );
  assert.equal(docx.length, 2);
  assert.equal(docx[0].locator, "page 1");
  assert.match(docx[0].text, /page one/);
  assert.equal(docx[1].locator, "page 2");

  const pptx = await extractDocument("training.pptx", await miniPptx(["Slide A cites para 4-5.", "Slide B."]));
  assert.equal(pptx.length, 2);
  assert.equal(pptx[0].locator, "slide 1");
  assert.match(pptx[0].text, /Slide A/);
  assert.equal(pptx[1].locator, "slide 2");
});
