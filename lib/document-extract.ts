import JSZip from "jszip";
import { isAllowedUploadName, uploadExtension } from "./upload-guard.ts";

export type ExtractedChunk = {
  locator: string;
  text: string;
};

function decodeXml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCharCode(Number(dec)));
}

function tidy(text: string): string {
  return text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
}

function docxPartText(xml: string): string {
  const withBreaks = xml.replace(/<\/w:p>/g, "\n").replace(/<w:tab\b[^/]*\/>/g, "\t");
  const texts: string[] = [];
  const re = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
  let match: RegExpExecArray | null;
  let cursor = 0;
  let out = "";
  while ((match = re.exec(withBreaks))) {
    const gap = withBreaks.slice(cursor, match.index);
    if (gap.includes("\n")) out += "\n";
    out += decodeXml(match[1]);
    cursor = match.index + match[0].length;
    texts.push(match[1]);
  }
  return tidy(out || texts.join(""));
}

function splitDocxPages(xml: string): string[] {
  const parts = xml.split(/<w:lastRenderedPageBreak\b[^/]*\/>|<w:br\b[^>]*w:type="page"[^/]*\/>/i);
  const pages = parts.map(docxPartText).filter(Boolean);
  return pages.length ? pages : [docxPartText(xml)].filter(Boolean);
}

function pptxSlideText(xml: string): string {
  const texts: string[] = [];
  const re = /<a:t\b[^>]*>([\s\S]*?)<\/a:t>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) texts.push(decodeXml(match[1]));
  return tidy(texts.join(" "));
}

async function extractDocx(buffer: Buffer): Promise<ExtractedChunk[]> {
  const zip = await JSZip.loadAsync(buffer);
  const doc = zip.file("word/document.xml");
  if (!doc) throw new Error("This .docx file has no document.xml.");
  const xml = await doc.async("string");
  return splitDocxPages(xml).map((text, index) => ({ locator: `page ${index + 1}`, text }));
}

async function extractPptx(buffer: Buffer): Promise<ExtractedChunk[]> {
  const zip = await JSZip.loadAsync(buffer);
  const slides = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const na = Number(/slide(\d+)\.xml/i.exec(a)?.[1] ?? 0);
      const nb = Number(/slide(\d+)\.xml/i.exec(b)?.[1] ?? 0);
      return na - nb;
    });
  if (!slides.length) throw new Error("This .pptx file has no slides.");
  const chunks: ExtractedChunk[] = [];
  for (const name of slides) {
    const xml = await zip.file(name)!.async("string");
    const n = /slide(\d+)\.xml/i.exec(name)?.[1] ?? String(chunks.length + 1);
    const text = pptxSlideText(xml);
    if (text) chunks.push({ locator: `slide ${n}`, text });
  }
  return chunks.length ? chunks : [{ locator: "slide 1", text: "" }];
}

async function extractPdf(buffer: Buffer): Promise<ExtractedChunk[]> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const result = await extractText(pdf, { mergePages: false });
  const pages = Array.isArray(result.text) ? result.text : [String(result.text ?? "")];
  const chunks = pages
    .map((text, index) => ({ locator: `page ${index + 1}`, text: tidy(String(text ?? "")) }))
    .filter((chunk) => chunk.text);
  return chunks.length ? chunks : [{ locator: "page 1", text: "" }];
}

export async function extractDocument(filename: string, buffer: Buffer): Promise<ExtractedChunk[]> {
  if (!isAllowedUploadName(filename)) {
    throw new Error("Only .docx, .pdf, and .pptx files can be compared.");
  }
  const ext = uploadExtension(filename);
  if (ext === ".docx") return extractDocx(buffer);
  if (ext === ".pptx") return extractPptx(buffer);
  return extractPdf(buffer);
}
