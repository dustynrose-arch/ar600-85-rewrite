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
 * Stable outline ids that warrant Limited Use Assist. Hidden for every other
 * open section, including unrelated chapters and display-number lookalikes.
 *
 * Chapter 10 cluster: 10-11 through 10-13 (definition / implementation).
 * Self-referral: 7-3, B-5.
 * Protected evidence: 10-12.
 * Commander Limited Use briefing: B-5, B-10, 9-11.
 * Biochemical (and other) ID paths that invoke Limited Use: 7-4, 7-5, 7-6, 7-7.
 */
export const LIMITED_USE_ASSIST_SECTION_IDS: ReadonlySet<string> = new Set([
  "10-11",
  "10-12",
  "10-13",
  "7-3",
  "7-4",
  "7-5",
  "7-6",
  "7-7",
  "9-11",
  "B-5",
  "B-10",
]);

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

export function sectionWarrantsLimitedUseAssist(sectionId: string | null | undefined): boolean {
  return Boolean(sectionId && LIMITED_USE_ASSIST_SECTION_IDS.has(sectionId));
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
 * Adverse-action titles still follow the existing `limitedUse` text/binding gate.
 * Limited Use chips are gated on the open outline section’s stable id (hidden
 * by default; never inferred from display numbers or unrelated-chapter text).
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
  if (sectionWarrantsLimitedUseAssist(sectionId)) chips.push(limitedUseAssistChip());
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
