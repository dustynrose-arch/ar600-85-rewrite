import baselineJson from "./seed/baseline-document.json";
import type { BaselineDocument, Chapter, Section } from "./types";

export const baselineDocument = baselineJson as BaselineDocument;

export function flattenSections(doc: BaselineDocument = baselineDocument): Section[] {
  return doc.chapters.flatMap((chapter) => chapter.sections);
}

export function sectionMap(doc: BaselineDocument = baselineDocument): Record<string, Section> {
  return Object.fromEntries(flattenSections(doc).map((section) => [section.id, section]));
}

export function findChapter(sectionId: string, doc: BaselineDocument = baselineDocument): Chapter | undefined {
  return doc.chapters.find((chapter) => chapter.sections.some((section) => section.id === sectionId));
}

export function getSection(sectionId: string, doc: BaselineDocument = baselineDocument): Section | undefined {
  return flattenSections(doc).find((section) => section.id === sectionId);
}
