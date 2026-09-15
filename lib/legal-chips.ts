import type { AssistBinding } from "./types.ts";

/** Locked Assist copy — titles change; this body does not. */
export const LEGAL_CHIP_BODY =
  "Cite the sister publication; do not copy its procedures here. Point flagging and separation actions to those regulations. Do not expand protected evidence.";

export const LEGAL_CITE_PUBS = ["AR 600-8-2", "AR 635-200", "AR 135-175", "AR 135-178"] as const;

export const GUIDE_LEGAL_ONE_LINER =
  "Assist shows two kinds of legal help: Limited Use Policy (self-referral) — the AR 600-85 protection that only applies in qualifying self-referral cases — and Legal / adverse-action hints for other rights/discipline risks. Don’t read every legal chip as Limited Use.";

export const LIMITED_USE_CATEGORY = "Limited Use Policy (self-referral)";
export const ADVERSE_ACTION_CATEGORY = "Legal / adverse-action hint";

/** Plain-language cite shown with Limited Use Assist (suggestion only — no auto-rewrite). */
export const LIMITED_USE_SEE_CITE = "See para 10-12 / 10-13";

export const LIMITED_USE_CHIP_TITLE = "Limited Use Policy (self-referral)";

/**
 * Cheech + Justice locked trigger list (stable outline ids).
 *
 * Limited Use policy: 10-11 through 10-13, plus related ch.10 that invokes it (10-15).
 * Self-referral / self-ID: chapter 7 identification path (especially 7-1, 7-3).
 * Protected evidence / results under Limited Use: 10-12.
 * Commander Limited Use briefing: B-5, B-10, 9-11.
 * Biochemical / test-result paths that invoke Limited Use: 7-4, 7-5 (and 7-6, 7-7).
 *
 * Adverse-action language that treats self-ID as open season stays the existing
 * adverse-action chip — not this standing Limited Use panel.
 */
export const LIMITED_USE_ASSIST_SECTION_IDS: ReadonlySet<string> = new Set([
  "10-11",
  "10-12",
  "10-13",
  "10-15",
  "7-1",
  "7-2",
  "7-3",
  "7-4",
  "7-5",
  "7-6",
  "7-7",
  "9-11",
  "B-5",
  "B-10",
]);

/** Chapters that never show the Limited Use standing panel. */
const LIMITED_USE_HIDE_CHAPTERS = new Set([
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "8",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "A",
  "C",
  "D",
  "E",
  "F",
  "G",
]);

/** Draft hits for Limited Use / self-ID / protected evidence (not characterization / 42 CFR). */
export const LIMITED_USE_DRAFT_HIT_RE =
  /\blimited use\b|\bself[- ]?referral\b|\bself[- ]?identification\b|\bself[- ]?id\b|\bprotected evidence\b|\bprotected use\b/i;

export function chapterKeyFromSectionId(sectionId: string | null | undefined): string | null {
  if (!sectionId) return null;
  const match = sectionId.match(/^(\d+|[A-G])(?=-|$)/i);
  return match ? match[1]!.toUpperCase() : null;
}

export type LegalChipCategory = typeof LIMITED_USE_CATEGORY | typeof ADVERSE_ACTION_CATEGORY;

export type LegalChip = {
  id:
    | "limited-use-self-referral"
    | "adverse-testing-bases"
    | "adverse-process-path"
    | "adverse-rights-art31"
    | "adverse-civilian-path"
    | "adverse-other";
  category: LegalChipCategory;
  title: string;
  seeCite?: string;
};

const LEGAL_CHIP_SPECS: {
  id: Exclude<LegalChip["id"], "adverse-other">;
  category: LegalChipCategory;
  title: string;
  pattern: RegExp;
}[] = [
  {
    id: "adverse-testing-bases",
    category: ADVERSE_ACTION_CATEGORY,
    title: "Legal / adverse-action hint — testing bases",
    pattern:
      /\b(inspection random|collection code|probable cause|competence for duty|command-directed|inspection other)\b/i,
  },
  {
    id: "adverse-process-path",
    category: ADVERSE_ACTION_CATEGORY,
    title: "Legal / adverse-action hint — process path",
    pattern: /\bcharacterization\b|\bcommand referral\b/i,
  },
  {
    id: "adverse-rights-art31",
    category: ADVERSE_ACTION_CATEGORY,
    title: "Legal / adverse-action hint — rights / Art. 31",
    pattern: /\b42 cfr\b|\barticle\s*31\b|\bart\.?\s*31\b|\bcoerc|\brights warning\b|\bDA Form 3881\b/i,
  },
  {
    id: "adverse-civilian-path",
    category: ADVERSE_ACTION_CATEGORY,
    title: "Legal / adverse-action hint — civilian path",
    pattern: /\bEAP\b|\bemployee assistance\b|\btesting designated position\b|\bTDP\b/,
  },
];

export function sectionHidesLimitedUseAssist(sectionId: string | null | undefined): boolean {
  if (!sectionId) return true;
  if (LIMITED_USE_ASSIST_SECTION_IDS.has(sectionId)) return false;
  const chapter = chapterKeyFromSectionId(sectionId);
  if (!chapter) return false;
  if (chapter === "7") return false;
  if (chapter === "9") return sectionId !== "9-11";
  if (chapter === "10" || chapter === "B") return true;
  return LIMITED_USE_HIDE_CHAPTERS.has(chapter);
}

export function sectionWarrantsLimitedUseAssist(
  sectionId?: string | null,
  title = "",
  body = "",
): boolean {
  if (sectionHidesLimitedUseAssist(sectionId)) return false;
  if (sectionId && LIMITED_USE_ASSIST_SECTION_IDS.has(sectionId)) return true;
  if (chapterKeyFromSectionId(sectionId) === "7") return true;
  return LIMITED_USE_DRAFT_HIT_RE.test(`${title} ${body}`);
}

export function limitedUseAssistChip(): LegalChip {
  return {
    id: "limited-use-self-referral",
    category: LIMITED_USE_CATEGORY,
    title: LIMITED_USE_CHIP_TITLE,
    seeCite: LIMITED_USE_SEE_CITE,
  };
}

/**
 * Adverse-action titles still follow the existing `limitedUse` text/binding gate
 * (including self-ID treated as open season — chip only, not the Limited Use panel).
 * Limited Use standing chips follow the locked Cheech/Justice trigger list:
 * open section id and/or draft hits, hidden on Purpose / ASAP admin / ADAPT–SUDCC
 * how-to / unrelated chapters.
 */
export function legalChipsFromWorkingText(
  title: string,
  body: string,
  limitedUse: AssistBinding["limitedUse"],
  sectionId?: string | null,
): LegalChip[] {
  const hay = `${title} ${body}`;
  const adverse = limitedUse
    ? LEGAL_CHIP_SPECS.filter(
        (spec) => spec.category === ADVERSE_ACTION_CATEGORY && spec.pattern.test(hay),
      ).map((spec) => ({
        id: spec.id,
        category: spec.category,
        title: spec.title,
      }))
    : [];
  const chips: LegalChip[] = [];
  if (sectionWarrantsLimitedUseAssist(sectionId, title, body)) chips.push(limitedUseAssistChip());
  chips.push(...adverse);
  if (chips.length) return chips;
  if (!limitedUse) return [];
  return [
    {
      id: "adverse-other",
      category: ADVERSE_ACTION_CATEGORY,
      title: "Legal / adverse-action hint",
    },
  ];
}

export function chipsInCategory(chips: LegalChip[], category: LegalChipCategory): LegalChip[] {
  return chips.filter((chip) => chip.category === category);
}
