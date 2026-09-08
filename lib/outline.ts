import type {
  BaselineDocument,
  ChapterKind,
  Section,
  StructurePosition,
  WorkingOutlineChapter,
  WorkingSection,
} from "./types.ts";

export type OutlineParents = {
  parentOf: Record<string, string>;
  siblings: Record<string, string[]>;
};

export function cloneOutline(outline: WorkingOutlineChapter[]): WorkingOutlineChapter[] {
  return outline.map((chapter) => ({
    ...chapter,
    sectionIds: [...chapter.sectionIds],
  }));
}

export function chapterKindFromLabel(label: string, id: string): ChapterKind {
  if (/^appendix/i.test(label) || /^[A-Z]$/.test(id)) return "appendix";
  return "chapter";
}

export function seedWorkingOutline(doc: BaselineDocument): WorkingOutlineChapter[] {
  return doc.chapters.map((chapter) => ({
    id: chapter.id,
    kind: chapterKindFromLabel(chapter.label, chapter.id),
    title: chapter.title,
    sectionIds: chapter.sections.map((section) => section.id),
  }));
}

export function parentIndexFromDocument(doc: BaselineDocument): OutlineParents {
  const parentOf: Record<string, string> = {};
  const siblings: Record<string, string[]> = {};
  for (const chapter of doc.chapters) {
    siblings[chapter.id] = chapter.sections.map((section) => section.id);
    for (const section of chapter.sections) {
      parentOf[section.id] = chapter.id;
    }
  }
  return { parentOf, siblings };
}

export function parentIndexFromOutline(outline: WorkingOutlineChapter[]): OutlineParents {
  const parentOf: Record<string, string> = {};
  const siblings: Record<string, string[]> = {};
  for (const chapter of outline) {
    siblings[chapter.id] = [...chapter.sectionIds];
    for (const sectionId of chapter.sectionIds) {
      parentOf[sectionId] = chapter.id;
    }
  }
  return { parentOf, siblings };
}

export function chapterNumberPrefix(chapter: WorkingOutlineChapter, outline: WorkingOutlineChapter[]): string {
  const peers = outline.filter((item) => item.kind === chapter.kind);
  const index = peers.findIndex((item) => item.id === chapter.id);
  if (chapter.kind === "appendix") return String.fromCharCode(65 + Math.max(0, index));
  return String(Math.max(0, index) + 1);
}

export function chapterDisplayLabel(chapter: WorkingOutlineChapter, outline: WorkingOutlineChapter[]): string {
  const prefix = chapterNumberPrefix(chapter, outline);
  return chapter.kind === "appendix" ? `Appendix ${prefix}` : `Chapter ${prefix}`;
}

export function applyDisplayNumbers(
  outline: WorkingOutlineChapter[],
  sections: Record<string, Pick<Section, "number">>,
): void {
  for (const chapter of outline) {
    const prefix = chapterNumberPrefix(chapter, outline);
    chapter.sectionIds.forEach((sectionId, index) => {
      const section = sections[sectionId];
      if (section) section.number = `${prefix}-${index + 1}`;
    });
  }
}

export function findChapter(
  outline: WorkingOutlineChapter[],
  chapterOrSectionId: string,
): WorkingOutlineChapter | undefined {
  return (
    outline.find((chapter) => chapter.id === chapterOrSectionId) ??
    outline.find((chapter) => chapter.sectionIds.includes(chapterOrSectionId))
  );
}

export function flattenOutlineSections<T extends Section>(
  outline: WorkingOutlineChapter[],
  sections: Record<string, T>,
): T[] {
  const result: T[] = [];
  for (const chapter of outline) {
    for (const sectionId of chapter.sectionIds) {
      const section = sections[sectionId];
      if (section) result.push(section);
    }
  }
  return result;
}

export function firstSectionId(outline: WorkingOutlineChapter[]): string | undefined {
  for (const chapter of outline) {
    if (chapter.sectionIds[0]) return chapter.sectionIds[0];
  }
  return undefined;
}

export function isChapterId(outline: WorkingOutlineChapter[], id: string): boolean {
  return outline.some((chapter) => chapter.id === id);
}

export function resolveInsert(
  outline: WorkingOutlineChapter[],
  targetId: string,
  position: StructurePosition,
): { chapterId: string; index: number } {
  const asChapter = outline.find((chapter) => chapter.id === targetId);
  if (asChapter) {
    if (position === "before") return { chapterId: asChapter.id, index: 0 };
    return { chapterId: asChapter.id, index: asChapter.sectionIds.length };
  }
  const chapter = findChapter(outline, targetId);
  if (!chapter) throw new Error(`Unknown outline target ${targetId}`);
  const current = chapter.sectionIds.indexOf(targetId);
  if (position === "before") return { chapterId: chapter.id, index: current };
  if (position === "after") return { chapterId: chapter.id, index: current + 1 };
  return { chapterId: chapter.id, index: chapter.sectionIds.length };
}

export function insertSectionId(
  outline: WorkingOutlineChapter[],
  sectionId: string,
  targetId: string,
  position: StructurePosition,
): WorkingOutlineChapter[] {
  const next = cloneOutline(outline);
  const dest = resolveInsert(next, targetId, position);
  const chapter = next.find((item) => item.id === dest.chapterId);
  if (!chapter) throw new Error(`Unknown chapter ${dest.chapterId}`);
  chapter.sectionIds.splice(dest.index, 0, sectionId);
  return next;
}

export function deleteSectionId(
  outline: WorkingOutlineChapter[],
  sectionId: string,
): { outline: WorkingOutlineChapter[]; parentId: string; index: number } {
  const next = cloneOutline(outline);
  const chapter = findChapter(next, sectionId);
  if (!chapter) throw new Error(`Unknown section ${sectionId}`);
  const index = chapter.sectionIds.indexOf(sectionId);
  if (index < 0) throw new Error(`Unknown section ${sectionId}`);
  chapter.sectionIds.splice(index, 1);
  return { outline: next, parentId: chapter.id, index };
}

export function moveSectionId(
  outline: WorkingOutlineChapter[],
  sectionId: string,
  parentId: string,
  index: number,
): { outline: WorkingOutlineChapter[]; fromParentId: string; toParentId: string } {
  const next = cloneOutline(outline);
  const from = findChapter(next, sectionId);
  const to = next.find((chapter) => chapter.id === parentId);
  if (!from) throw new Error(`Unknown section ${sectionId}`);
  if (!to) throw new Error(`Unknown chapter ${parentId}`);
  const fromIndex = from.sectionIds.indexOf(sectionId);
  if (fromIndex < 0) throw new Error(`Unknown section ${sectionId}`);
  from.sectionIds.splice(fromIndex, 1);
  const destIndex = from.id === to.id && fromIndex < index ? index - 1 : index;
  const clamped = Math.max(0, Math.min(destIndex, to.sectionIds.length));
  to.sectionIds.splice(clamped, 0, sectionId);
  return { outline: next, fromParentId: from.id, toParentId: to.id };
}

export function movedSectionIds(original: OutlineParents, draft: OutlineParents): string[] {
  const moved: string[] = [];
  const ids = new Set([...Object.keys(original.parentOf), ...Object.keys(draft.parentOf)]);
  for (const id of ids) {
    const fromParent = original.parentOf[id];
    const toParent = draft.parentOf[id];
    if (!fromParent || !toParent) continue;
    if (fromParent !== toParent) {
      moved.push(id);
      continue;
    }
    const originalSiblings = (original.siblings[fromParent] ?? []).filter((item) => draft.parentOf[item]);
    const draftSiblings = (draft.siblings[toParent] ?? []).filter((item) => original.parentOf[item]);
    if (originalSiblings.indexOf(id) !== draftSiblings.indexOf(id)) moved.push(id);
  }
  return moved;
}

export function outlineSectionLookup(
  outline: WorkingOutlineChapter[],
  sections: Record<string, WorkingSection | Section>,
): Record<string, WorkingSection | Section> {
  return Object.fromEntries(
    flattenOutlineSections(outline, sections).map((section) => [section.id, section]),
  );
}

export function assertBaselineUntouched(before: BaselineDocument, after: BaselineDocument): void {
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    throw new Error("ACTIVE baseline seed was mutated.");
  }
}
