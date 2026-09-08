import type { AssistBinding } from "./types.ts";

/** Locked Assist copy — titles change; this body does not. */
export const LEGAL_CHIP_BODY =
  "Cite the sister publication; do not copy its procedures here. Point flagging and separation actions to those regulations. Do not expand protected evidence.";

export const LEGAL_CITE_PUBS = ["AR 600-8-2", "AR 635-200", "AR 135-175", "AR 135-178"] as const;

export const GUIDE_LEGAL_ONE_LINER =
  "Assist shows two kinds of legal help: Limited Use Policy (self-referral) — the AR 600-85 protection that only applies in qualifying self-referral cases — and Legal / adverse-action hints for other rights/discipline risks. Don’t read every legal chip as Limited Use.";

export const LIMITED_USE_CATEGORY = "Limited Use Policy (self-referral)";
export const ADVERSE_ACTION_CATEGORY = "Legal / adverse-action hint";

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
};

const LEGAL_CHIP_SPECS: {
  id: Exclude<LegalChip["id"], "adverse-other">;
  category: LegalChipCategory;
  title: string;
  pattern: RegExp;
}[] = [
  {
    id: "limited-use-self-referral",
    category: LIMITED_USE_CATEGORY,
    title: "Limited Use Policy (self-referral)",
    pattern: /\blimited use\b|\bself[- ]?referral\b|\bprotected evidence\b/i,
  },
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

/**
 * Title split only. `limitedUse` is the existing Assist detection gate
 * (`LIMITED_USE_RE` / stable-id binding) — this does not add or drop firings.
 */
export function legalChipsFromWorkingText(
  title: string,
  body: string,
  limitedUse: AssistBinding["limitedUse"],
): LegalChip[] {
  if (!limitedUse) return [];
  const hay = `${title} ${body}`;
  const matched = LEGAL_CHIP_SPECS.filter((spec) => spec.pattern.test(hay)).map((spec) => ({
    id: spec.id,
    category: spec.category,
    title: spec.title,
  }));
  if (matched.length) return matched;
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
