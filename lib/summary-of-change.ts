import {
  flattenOutlineSections,
  movedSectionIds,
  parentIndexFromOutline,
  type OutlineParents,
} from "./outline.ts";
import type { Section, WorkingSection, WorkspaceState } from "./types.ts";

export const SUMMARY_VIEW_ID = "summary-of-change";

export const SUMMARY_EXPORT_TITLE =
  "Summary of Change (DRAFT — working copy; not authenticated under AR 25-30 / DA Pam 25-40)";

export const SUMMARY_TABLE_COLUMNS = ["Action", "Location", "Original (ACTIVE)", "Revised (your draft)"] as const;

export const SUMMARY_ADDS_ORIGINAL = "(none — new)";
export const SUMMARY_RESCINDS_REVISED = "(rescinded)";

export function originalCell(row: { action: ChangeAction; originalText: string | null }): string {
  if (row.action === "adds") return SUMMARY_ADDS_ORIGINAL;
  return row.originalText ?? "";
}

export function revisedCell(row: { action: ChangeAction; revisedText: string | null }): string {
  if (row.action === "rescinds") return SUMMARY_RESCINDS_REVISED;
  return row.revisedText ?? "";
}

export type ChangeAction = "revises" | "adds" | "rescinds" | "moves";

export type SummaryOfChangeRow = {
  id: string;
  action: ChangeAction;
  sectionId: string;
  sectionNumber: string;
  sectionTitle: string;
  cite: string;
  originalText: string | null;
  revisedText: string | null;
};

export type SummaryOfChangeResult = {
  title: string;
  rows: SummaryOfChangeRow[];
  counts: { revises: number; adds: number; rescinds: number; moves: number; total: number };
  movesDeferred: boolean;
};

type MarkerKind = "lead" | "letter" | "number" | "subletter" | "roman";

type ParaNode = {
  kind: MarkerKind;
  marker: string;
  text: string;
  children: ParaNode[];
};

const LETTER_LINE = /^([a-z])\.\s+(.*)$/;
const NUMBER_LINE = /^\s*\((\d+)\)\s*(.*)$/;
const ROMAN_MULTI_LINE = /^\s*\(((?:x|ix|iv|v?i{1,3}){2,}|x|iv|vi{0,3}|ix)\)\s+(.*)$/i;
const PAREN_LETTER_LINE = /^\s*\(([a-z])\)\s+(.*)$/;

export function apdSectionNumber(number: string): string {
  return number.replace(/-/g, "–");
}

export function formatParaCite(sectionNumber: string, suffix = ""): string {
  return `para ${apdSectionNumber(sectionNumber)}${suffix}`;
}

export function actionLabel(action: ChangeAction): string {
  if (action === "revises") return "Revises";
  if (action === "adds") return "Adds";
  if (action === "moves") return "Moves";
  return "Rescinds";
}

function normalizeUnitText(text: string): string {
  return text.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function isRomanToken(token: string): boolean {
  return /^(x|ix|iv|v?i{1,3})$/i.test(token);
}

function appendText(node: ParaNode, line: string): void {
  if (!line) {
    if (node.text) node.text += "\n";
    return;
  }
  node.text = node.text ? `${node.text}\n${line}` : line;
}

function looksLikeUnitStart(rest: string): boolean {
  const trimmed = rest.trimStart();
  if (!trimmed) return true;
  return /^[A-Z0-9“"‘'(\[]/.test(trimmed);
}

function uniqueSuffix(path: string[], used: Set<string>): string {
  let suffix = citeSuffix(path);
  if (!used.has(suffix)) {
    used.add(suffix);
    return suffix;
  }
  let n = 2;
  while (used.has(`${suffix}#${n}`)) n += 1;
  const next = `${suffix}#${n}`;
  used.add(next);
  return next;
}

function displaySuffix(suffix: string): string {
  return suffix.replace(/#\d+/g, "");
}

export function parseApdUnits(body: string): ParaNode[] {
  const roots: ParaNode[] = [];
  let lead: ParaNode | null = null;
  let letter: ParaNode | null = null;
  let number: ParaNode | null = null;
  let subletter: ParaNode | null = null;
  let roman: ParaNode | null = null;
  let current: ParaNode | null = null;

  const ensureLead = (): ParaNode => {
    if (!lead) {
      lead = { kind: "lead", marker: "", text: "", children: [] };
      roots.push(lead);
    }
    return lead;
  };

  const lines = body.replace(/\r\n/g, "\n").split("\n");
  for (const rawLine of lines) {
    const letterMatch = rawLine.match(LETTER_LINE);
    if (letterMatch) {
      letter = { kind: "letter", marker: letterMatch[1], text: letterMatch[2], children: [] };
      roots.push(letter);
      number = subletter = roman = null;
      current = letter;
      continue;
    }

    const numberMatch = rawLine.match(NUMBER_LINE);
    if (numberMatch && looksLikeUnitStart(numberMatch[2])) {
      const node: ParaNode = {
        kind: "number",
        marker: `(${numberMatch[1]})`,
        text: numberMatch[2],
        children: [],
      };
      if (letter) {
        letter.children.push(node);
      } else {
        ensureLead().children.push(node);
      }
      number = node;
      subletter = roman = null;
      current = node;
      continue;
    }

    const romanMatch = rawLine.match(ROMAN_MULTI_LINE);
    if (romanMatch && (subletter || number) && looksLikeUnitStart(romanMatch[2])) {
      const node: ParaNode = {
        kind: "roman",
        marker: `(${romanMatch[1].toLowerCase()})`,
        text: romanMatch[2],
        children: [],
      };
      (subletter ?? number)!.children.push(node);
      roman = node;
      current = node;
      continue;
    }

    const parenLetterMatch = rawLine.match(PAREN_LETTER_LINE);
    if (parenLetterMatch && (number || letter) && looksLikeUnitStart(parenLetterMatch[2])) {
      const token = parenLetterMatch[1];
      const treatAsRoman = Boolean(subletter) && isRomanToken(token);
      if (treatAsRoman) {
        const node: ParaNode = {
          kind: "roman",
          marker: `(${token})`,
          text: parenLetterMatch[2],
          children: [],
        };
        subletter!.children.push(node);
        roman = node;
        current = node;
        continue;
      }
      const node: ParaNode = {
        kind: "subletter",
        marker: `(${token})`,
        text: parenLetterMatch[2],
        children: [],
      };
      (number ?? letter)!.children.push(node);
      subletter = node;
      roman = null;
      current = node;
      continue;
    }

    if (!letter && !number) {
      current = ensureLead();
      appendText(current, rawLine);
      continue;
    }

    if (current) appendText(current, rawLine);
    else appendText(ensureLead(), rawLine);
  }

  return roots
    .map((node) => ({ ...node, text: normalizeUnitText(node.text) }))
    .filter((node) => node.kind !== "lead" || node.text || node.children.length > 0);
}

function citeSuffix(path: string[]): string {
  return path.join("");
}

function displayMarker(node: ParaNode): string {
  if (node.kind === "letter") return `${node.marker}.`;
  return node.marker;
}

export function reconstructUnit(node: ParaNode): string {
  const head = node.kind === "lead" ? node.text : `${displayMarker(node)} ${node.text}`.trim();
  if (node.children.length === 0) return head;
  const kids = node.children.map((child) => reconstructUnit(child)).join("\n");
  return head ? `${head}\n${kids}` : kids;
}

function excerpt(text: string, max = 280): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max - 1)}…`;
}

function walkUnits(
  nodes: ParaNode[],
  path: string[],
  visit: (node: ParaNode, suffix: string) => void,
  used: Set<string> = new Set(),
): void {
  for (const node of nodes) {
    const nextPath = node.kind === "lead" ? path : [...path, node.marker];
    const suffix = uniqueSuffix(nextPath, used);
    visit(node, suffix);
    walkUnits(node.children, node.kind === "lead" ? path : nextPath, visit, used);
  }
}

function indexUnits(nodes: ParaNode[]): Map<string, ParaNode> {
  const map = new Map<string, ParaNode>();
  walkUnits(nodes, [], (node, suffix) => {
    map.set(suffix, node);
  });
  return map;
}

function isDescendantSuffix(child: string, parent: string): boolean {
  if (child === parent) return false;
  if (parent === "") return child !== "";
  const next = child[parent.length];
  return child.startsWith(parent) && (next === "(" || next === "#");
}

function compareTrees(
  originalNodes: ParaNode[],
  draftNodes: ParaNode[],
  section: { id: string; number: string; title: string },
  rows: SummaryOfChangeRow[],
): void {
  const originalMap = indexUnits(originalNodes);
  const draftMap = indexUnits(draftNodes);
  const skipDraft = new Set<string>();
  const skipOriginal = new Set<string>();

  const push = (
    action: ChangeAction,
    suffix: string,
    originalText: string | null,
    revisedText: string | null,
  ) => {
    const cite = formatParaCite(section.number, displaySuffix(suffix));
    rows.push({
      id: `${action}:${section.id}:${suffix || "lead"}`,
      action,
      sectionId: section.id,
      sectionNumber: section.number,
      sectionTitle: section.title,
      cite,
      originalText,
      revisedText,
    });
  };

  for (const [suffix, node] of draftMap) {
    if (skipDraft.has(suffix)) continue;
    const original = originalMap.get(suffix);
    if (!original) {
      push("adds", suffix, null, reconstructUnit(node));
      for (const childSuffix of draftMap.keys()) {
        if (isDescendantSuffix(childSuffix, suffix)) skipDraft.add(childSuffix);
      }
      continue;
    }
    if (normalizeUnitText(original.text) !== normalizeUnitText(node.text)) {
      push("revises", suffix, normalizeUnitText(original.text), normalizeUnitText(node.text));
    }
  }

  for (const [suffix, node] of originalMap) {
    if (skipOriginal.has(suffix) || draftMap.has(suffix)) continue;
    push("rescinds", suffix, excerpt(reconstructUnit(node)), null);
    for (const childSuffix of originalMap.keys()) {
      if (isDescendantSuffix(childSuffix, suffix)) skipOriginal.add(childSuffix);
    }
  }
}

function excerptSection(section: Section | WorkingSection): string {
  const title = section.title?.trim() ?? "";
  const body = excerpt(section.body ?? "", 280);
  if (title && body) return `${title} — ${body}`;
  return title || body || "(empty)";
}

function pushWhole(
  rows: SummaryOfChangeRow[],
  action: ChangeAction,
  section: Section | WorkingSection,
  originalText: string | null,
  revisedText: string | null,
  suffix: string,
): void {
  rows.push({
    id: `${action}:${section.id}:${suffix}`,
    action,
    sectionId: section.id,
    sectionNumber: section.number,
    sectionTitle: section.title,
    cite: formatParaCite(section.number),
    originalText,
    revisedText,
  });
}

export function buildSummaryOfChange(
  originalSections: Record<string, Section>,
  draftSections: Record<string, WorkingSection | Section>,
  order?: Section[],
  structure?: { original: OutlineParents; draft: OutlineParents },
): SummaryOfChangeResult {
  const rows: SummaryOfChangeRow[] = [];
  const seenIds = new Set<string>();
  const sequence =
    order ??
    [
      ...Object.values(originalSections),
      ...Object.values(draftSections).filter((section) => !originalSections[section.id]),
    ];
  const moved = new Set(structure ? movedSectionIds(structure.original, structure.draft) : []);

  for (const section of sequence) {
    if (seenIds.has(section.id)) continue;
    seenIds.add(section.id);
    const original = originalSections[section.id];
    const draft = draftSections[section.id];

    if (original && !draft) {
      pushWhole(rows, "rescinds", original, excerptSection(original), null, "structure");
      continue;
    }
    if (!original && draft) {
      pushWhole(rows, "adds", draft, null, excerptSection(draft), "structure");
      continue;
    }
    if (!original || !draft) continue;

    if (moved.has(section.id)) {
      pushWhole(
        rows,
        "moves",
        draft,
        `${formatParaCite(original.number)} ${original.title}`,
        `${formatParaCite(draft.number)} ${draft.title}`,
        "structure",
      );
    }
    if (original.title !== draft.title) {
      pushWhole(rows, "revises", draft, original.title, draft.title, "title");
    }
    compareTrees(parseApdUnits(original.body ?? ""), parseApdUnits(draft.body ?? ""), draft, rows);
  }

  for (const [id, original] of Object.entries(originalSections)) {
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    if (!draftSections[id]) {
      pushWhole(rows, "rescinds", original, excerptSection(original), null, "structure");
    }
  }

  for (const [id, draft] of Object.entries(draftSections)) {
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    if (!originalSections[id]) {
      pushWhole(rows, "adds", draft, null, excerptSection(draft), "structure");
    }
  }

  const counts = {
    revises: rows.filter((row) => row.action === "revises").length,
    adds: rows.filter((row) => row.action === "adds").length,
    rescinds: rows.filter((row) => row.action === "rescinds").length,
    moves: rows.filter((row) => row.action === "moves").length,
    total: rows.length,
  };

  return {
    title: SUMMARY_EXPORT_TITLE,
    rows,
    counts,
    movesDeferred: false,
  };
}

export function buildSummaryFromWorkspace(
  state: Pick<WorkspaceState, "workingSections" | "workingOutline">,
  originalSections: Record<string, Section>,
  originalParents: OutlineParents,
): SummaryOfChangeResult {
  const outline = state.workingOutline ?? [];
  const order = flattenOutlineSections(outline, state.workingSections);
  return buildSummaryOfChange(originalSections, state.workingSections, order, {
    original: originalParents,
    draft: parentIndexFromOutline(outline),
  });
}

export function overlayDraftSection(
  workingSections: Record<string, WorkingSection | Section>,
  sectionId: string | null | undefined,
  draftBody: string | null | undefined,
): Record<string, WorkingSection | Section> {
  if (!sectionId || draftBody == null || !workingSections[sectionId]) return workingSections;
  return {
    ...workingSections,
    [sectionId]: {
      ...workingSections[sectionId],
      body: draftBody,
    },
  };
}
