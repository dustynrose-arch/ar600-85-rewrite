import { PROCESS_MAP } from "./seed/process-map.ts";
import { GLOSSARY_TERMS } from "./seed/glossary.ts";
import type { AssistBinding, Section, WorkingSection } from "./types.ts";

export const LIMITED_USE_RE = /limited use|protected evidence|self-referral|characterization|42 cfr/i;

export function sectionByStableId<T extends { id: string; number?: string }>(
  sections: Record<string, T> | T[],
  id: string | null | undefined,
): T | undefined {
  if (!id) return undefined;
  if (Array.isArray(sections)) return sections.find((section) => section.id === id);
  const byId = sections[id];
  if (byId && byId.id === id) return byId;
  return undefined;
}

export function chipsFromWorkingText(title: string, body: string): Pick<AssistBinding, "glossaryTermIds" | "limitedUse"> {
  const hay = `${title} ${body}`.toLowerCase();
  return {
    glossaryTermIds: GLOSSARY_TERMS.filter((term) => {
      if (!term.locked) return false;
      return hay.includes(term.term.toLowerCase()) || (term.acronym ? hay.includes(term.acronym.toLowerCase()) : false);
    }).map((term) => term.id),
    limitedUse: LIMITED_USE_RE.test(hay),
  };
}

export function processNodeIdsForSection(sectionId: string): string[] {
  return PROCESS_MAP.nodes.filter((node) => node.cite === sectionId).map((node) => node.id);
}

export function emptyAssistBinding(sectionId: string): AssistBinding {
  return {
    sectionId,
    glossaryTermIds: [],
    limitedUse: false,
    processNodeIds: processNodeIdsForSection(sectionId),
  };
}

export function bindingFromWorking(section: Pick<Section, "id" | "title" | "body">): AssistBinding {
  const chips = chipsFromWorkingText(section.title, section.body);
  return {
    sectionId: section.id,
    glossaryTermIds: chips.glossaryTermIds,
    limitedUse: chips.limitedUse,
    processNodeIds: processNodeIdsForSection(section.id),
  };
}

export function seedAssistBindings(sections: Record<string, WorkingSection | Section>): Record<string, AssistBinding> {
  return Object.fromEntries(Object.values(sections).map((section) => [section.id, bindingFromWorking(section)]));
}

export function viewAssistChips(
  section: Pick<Section, "id" | "title" | "body">,
  binding: AssistBinding | undefined,
  draftBody?: string | null,
): Pick<AssistBinding, "glossaryTermIds" | "limitedUse"> {
  if (draftBody != null) return chipsFromWorkingText(section.title, draftBody);
  if (binding && binding.sectionId === section.id) {
    return { glossaryTermIds: binding.glossaryTermIds, limitedUse: binding.limitedUse };
  }
  return chipsFromWorkingText(section.title, section.body);
}

export function processHighlightIds(sectionId: string, liveIds: Set<string>): string[] {
  if (!liveIds.has(sectionId)) return [];
  return processNodeIdsForSection(sectionId);
}

export function dropAssistState<T extends {
  assistBindings?: Record<string, AssistBinding>;
  wgReviewMarks: { sectionId: string }[];
  sergeant: { citeTo?: string }[];
}>(state: T, sectionId: string): void {
  if (state.assistBindings) delete state.assistBindings[sectionId];
  state.wgReviewMarks = state.wgReviewMarks.filter((mark) => mark.sectionId !== sectionId);
  for (const row of state.sergeant) {
    if (row.citeTo === sectionId) delete row.citeTo;
  }
}
