import { randomUUID } from "node:crypto";
import type { ExtractedChunk } from "./document-extract.ts";
import { formatParaCite, parseApdUnits } from "./summary-of-change.ts";
import type { CrossmatchRow, CrossmatchVerdict, Section, WorkingSection } from "./types.ts";

export type DraftLike = Pick<Section, "id" | "number" | "title" | "body">;

export type CrossmatchInput = {
  filename: string;
  chunks: ExtractedChunk[];
  draftSections: Record<string, DraftLike | WorkingSection>;
  originalSections?: Record<string, DraftLike>;
};

type ParsedCite = {
  raw: string;
  index: number;
  sectionKey: string;
  suffix: string;
};

type TermHit = {
  id: string;
  reason: string;
};

const DASH = "[\\-–—]";
const CITE_RE = new RegExp(
  String.raw`\b(?:AR\s*600${DASH}85[,:]?\s*)?(?:para(?:graph)?s?|¶)\s+([A-Ga-g]|\d+)${DASH}(\d+)([a-z])?(?:\((\d+)\))?(?:\(([a-z])\))?(?:\(([ivxlcdm]+)\))?`,
  "gi",
);
const APP_CITE_RE = new RegExp(
  String.raw`\b(?:appendix|app\.?)\s+([A-Ga-g])${DASH}(\d+)([a-z])?(?:\((\d+)\))?(?:\(([a-z])\))?(?:\(([ivxlcdm]+)\))?`,
  "gi",
);

const STOP = new Set([
  "the",
  "and",
  "for",
  "that",
  "this",
  "with",
  "from",
  "are",
  "was",
  "were",
  "will",
  "shall",
  "must",
  "may",
  "not",
  "into",
  "their",
  "them",
  "than",
  "then",
  "para",
  "paragraph",
  "see",
  "per",
]);

export function normalizeDash(text: string): string {
  return text.replace(/[–—]/g, "-");
}

export function excerpt(text: string, max = 280): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return "";
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max - 1)}…`;
}

function excerptAround(text: string, index: number, length: number, max = 280): string {
  const start = Math.max(0, index - 70);
  const end = Math.min(text.length, index + length + 210);
  let slice = text.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) slice = `…${slice}`;
  if (end < text.length) slice = `${slice}…`;
  return excerpt(slice, max);
}

function tokens(text: string): string[] {
  return normalizeDash(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP.has(word));
}

function overlapRatio(a: string, b: string): number {
  const left = new Set(tokens(a));
  const right = tokens(b);
  if (!left.size || !right.length) return 0;
  let hit = 0;
  for (const word of right) if (left.has(word)) hit += 1;
  return hit / right.length;
}

function hasNegation(text: string): boolean {
  return /\b(shall not|will not|may not|must not)\b/i.test(text);
}

function numberTokens(text: string): string[] {
  return [...normalizeDash(text).matchAll(/\b\d+(?:\.\d+)?\s*(?:percent|%|days?|hours?)\b/gi)].map((m) =>
    m[0].toLowerCase().replace(/\s+/g, ""),
  );
}

function obligations(text: string): string[] {
  const found =
    text.match(
      /((?:commanders?|soldiers?|the commander|units?|garrison|installations?)\s+(?:shall|will|must)\s+[^.]{8,200})/gi,
    ) ??
    text.match(/\b(?:shall|will|must)\s+[^.]{12,200}/gi) ??
    [];
  return found.map((item) => item.trim());
}

function looksLikeSisterCopy(text: string): boolean {
  const flagProc =
    /\b(flag codes?|initiate a flag|remove the flag|transfer (?:the )?flag|suspension of favorable|flagging action)\b/i.test(
      text,
    );
  const sepProc =
    /\b(characterization of service|administrative separation board|show[- ]cause|rehab(?:ilitation)? failure board|separation packet)\b/i.test(
      text,
    );
  if (!flagProc && !sepProc) return false;
  return !hasCorrectSisterCite(text);
}

function hasCorrectSisterCite(text: string): boolean {
  return (
    /\b(?:see|refer to)\s+AR\s*600[\-–]8[\-–]2\b/i.test(text) ||
    /\b(?:see|refer to)\s+AR\s*635[\-–]200\b/i.test(text)
  );
}

function sisterTopic(text: string): boolean {
  return /\b(flag(?:ging)?|separat(?:e|ion)|characterization|rehab(?:ilitation)? failure)\b/i.test(text);
}

export function findTermFlags(text: string): TermHit[] {
  const hits: TermHit[] = [];
  const add = (id: string, reason: string) => {
    if (!hits.some((hit) => hit.id === id)) hits.push({ id, reason });
  };

  if (
    /\brandom\s+(ua|urinalysis|drug\s+tests?)\b/i.test(text) ||
    (/\bua program\b/i.test(text) && !/\binspection random\b|\b\(\s*IR\s*\)/i.test(text))
  ) {
    add(
      "ir-vague",
      "Prefer Inspection Random (IR). Flag vague “random UA”, “random drug test”, or “UA program” alone.",
    );
  }
  if (/\binspection other\b/i.test(text) && /\b(\bIR\b|inspection random|random (?:ua|urinalysis|inspection))/i.test(text)) {
    add("io-as-ir", "Inspection Other is not Inspection Random (IR). Do not call it IR.");
  }
  if (
    (/\bfitness test\b/i.test(text) || /\bcommander'?s discretion(?:\s+test)?\b/i.test(text)) &&
    !/\bcompetence for duty\b|\b\(\s*CO\s*\)/i.test(text)
  ) {
    add(
      "co-vague",
      "Use competence for duty (CO). Flag fitness test or a vague commander’s-discretion test.",
    );
  }
  if (
    /\bprobable cause\b|\b\(\s*PO\s*\)/i.test(text) &&
    /\b(competence for duty|\bCO\b|inspection random|\bIR\b)\b/i.test(text) &&
    /\b(same as|also called|merged|mixed|treated as|is an?)\b/i.test(text)
  ) {
    add("po-merged", "Keep probable cause (PO) distinct from competence for duty (CO) and Inspection Random (IR).");
  }
  if (/\billicit use\b/i.test(text) && /\bprescription\b/i.test(text) && /\b(same|includes?|means|is)\b/i.test(text)) {
    add("illicit-vs-rx", "Keep illicit use distinct from prescription misuse.");
  }
  if (
    (/\basap counseling\b/i.test(text) ||
      /\btreatment center\b/i.test(text) ||
      (/\bSAP\b/.test(text) && /\b(counsel|treatment|rehab)\b/i.test(text))) &&
    !/\bSUDCC\b|substance use disorder clinical care/i.test(text)
  ) {
    add(
      "sudcc-vs-asap",
      "Clinical care is SUDCC. Do not use ASAP counseling, SAP, or a vague treatment center as the locked term.",
    );
  }
  if (/\b(adapt|prime for life)\b/i.test(text) && /\b(sudcc|rehab(?:ilitation)?|clinical (?:care|treatment))\b/i.test(text)) {
    add("adapt-not-sudcc", "ADAPT / Prime for Life is prevention education — do not call it SUDCC or rehab.");
  }
  if (
    (/\bEAP\b|employee assistance/i.test(text) && /\bTDP\b|testing designated position/i.test(text) &&
      /\b(same|soldier|enlisted|swap|instead of)\b/i.test(text)) ||
    (/\bEAP\b/i.test(text) && /\b(soldier|urinalysis roster|unit deterrence)\b/i.test(text))
  ) {
    add("eap-tdp", "Keep Employee Assistance Program (EAP) distinct from Testing Designated Position (TDP) rules.");
  }
  if (
    /\b(limited use|self[- ]?(id|identification|referral))\b/i.test(text) &&
    /\b(immunit|cannot be (used|prosecut|punish)|protects from any|no disciplinary|complete shield)\b/i.test(text)
  ) {
    add(
      "lup-overbroad",
      "Limited Use Policy is not overbroad self-identification immunity. Do not write it as a complete shield.",
    );
  }
  if (
    /\bcommand(?:er)?(?:'s)?\s+referral\b/i.test(text) &&
    /\bself[- ]?(referral|identification|id)\b/i.test(text) &&
    /\b(same as|interchangeable|also called|treated as|is a)\b/i.test(text)
  ) {
    add("referral-blend", "Keep command referral and self-referral distinct.");
  }
  if (/\bUPL\b/.test(text)) {
    add("upl-role", "UPL is the former title. Do not swap UPL / ADCO / DTC roles — use UDL, ADCO, and DTC as locked.");
  }
  if (/\bADCO\b/.test(text) && /\b(collect|specimen|bottle|observer|dd form 2624)\b/i.test(text)) {
    add("adco-dtc", "Do not give ADCO the DTC collection role.");
  }
  if (/\bDTC\b/.test(text) && /\b(adco|prevention education|counsel Soldiers)\b/i.test(text)) {
    add("dtc-swap", "Do not swap the DTC role with ADCO or prevention counseling.");
  }
  if (/\brehab(?:ilitation)? failure\b/i.test(text) && !/\bAR\s*635[\-–]200\b/i.test(text)) {
    add("rehab-failure", "Rehab failure separations cite AR 635-200. Do not invent a process here.");
  }
  return hits;
}

function suffixFromGroups(letter?: string, num?: string, sub?: string, roman?: string): string {
  let suffix = letter ?? "";
  if (num) suffix += `(${num})`;
  if (sub) suffix += `(${sub})`;
  if (roman) suffix += `(${roman})`;
  return suffix;
}

export function parseCites(text: string): ParsedCite[] {
  const found: ParsedCite[] = [];
  const push = (regex: RegExp, appendix: boolean) => {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text))) {
      const head = appendix ? match[1].toUpperCase() : match[1];
      const sectionKey = `${head}-${match[2]}`.replace(/^([a-z])/, (ch) => ch.toUpperCase());
      found.push({
        raw: match[0].replace(/\s+/g, " ").trim(),
        index: match.index,
        sectionKey: normalizeDash(sectionKey),
        suffix: suffixFromGroups(match[3], match[4], match[5], match[6]),
      });
    }
  };
  push(CITE_RE, false);
  push(APP_CITE_RE, true);
  const seen = new Set<string>();
  return found.filter((cite) => {
    const key = `${cite.index}:${cite.sectionKey}:${cite.suffix}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function unitMap(body: string): Map<string, string> {
  const map = new Map<string, string>();
  const walk = (nodes: ReturnType<typeof parseApdUnits>, path: string[]) => {
    for (const node of nodes) {
      const next = node.kind === "lead" ? path : [...path, node.marker];
      map.set(next.join(""), node.text);
      walk(node.children, next);
    }
  };
  walk(parseApdUnits(body), []);
  return map;
}

function lookupSection(
  key: string,
  sections: Record<string, DraftLike | WorkingSection>,
): DraftLike | undefined {
  const want = key.toLowerCase();
  for (const section of Object.values(sections)) {
    const id = normalizeDash(section.id).toLowerCase();
    const number = normalizeDash(section.number).toLowerCase();
    if (id === want || number === want) return section;
  }
  return undefined;
}

function emptyBody(section: DraftLike | undefined): boolean {
  return !section || !section.body.replace(/\s+/g, " ").trim();
}

function row(
  input: Omit<CrossmatchRow, "id">,
): CrossmatchRow {
  return { id: randomUUID(), ...input };
}

function conflicts(documentText: string, draftText: string): boolean {
  if (!draftText.trim() || !documentText.trim()) return false;
  if (hasNegation(documentText) !== hasNegation(draftText) && overlapRatio(draftText, documentText) > 0.25) {
    return true;
  }
  const docNums = new Set(numberTokens(documentText));
  const draftNums = new Set(numberTokens(draftText));
  if (docNums.size && draftNums.size) {
    for (const value of docNums) {
      if (![...draftNums].includes(value) && /days|percent|%|hours/.test(value)) return true;
    }
  }
  return false;
}

function missingRule(documentText: string, draftText: string): boolean {
  const phrases = obligations(documentText);
  if (!phrases.length) return false;
  return phrases.some((phrase) => overlapRatio(draftText, phrase) < 0.28);
}

function sharedPolicyPhrases(documentText: string, draftText: string): boolean {
  const phrases = [
    /inspection random/i,
    /\bIR\b/,
    /competence for duty/i,
    /probable cause/i,
    /limited use policy/i,
    /\bSUDCC\b|substance use disorder clinical care/i,
  ];
  return phrases.some((re) => re.test(documentText) && re.test(draftText));
}

function agrees(documentText: string, draftText: string): boolean {
  if (!draftText.trim() || !documentText.trim()) return false;
  if (conflicts(documentText, draftText) || missingRule(documentText, draftText)) return false;
  if (sisterTopic(documentText) && hasCorrectSisterCite(documentText)) return true;
  if (sharedPolicyPhrases(documentText, draftText)) return true;
  return overlapRatio(draftText, documentText) >= 0.3;
}

export function crossmatchDocument(input: CrossmatchInput): CrossmatchRow[] {
  const draft = structuredClone(input.draftSections);
  const original = input.originalSections ?? {};
  const rows: CrossmatchRow[] = [];
  const seen = new Set<string>();

  const push = (next: CrossmatchRow) => {
    const key = `${next.locator}|${next.locationCite}|${next.verdict}|${next.reason}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push(next);
  };

  for (const chunk of input.chunks) {
    const cites = parseCites(chunk.text);
    const chunkFlags = findTermFlags(chunk.text);
    const sisterCopy = looksLikeSisterCopy(chunk.text);

    if (!cites.length) {
      if (chunkFlags.length) {
        for (const flag of chunkFlags) {
          push(
            row({
              sourceFile: input.filename,
              locator: chunk.locator,
              locationCite: "(no paragraph cite)",
              sectionId: null,
              draftExcerpt: "",
              documentExcerpt: excerpt(chunk.text),
              verdict: "miss",
              reason: flag.reason,
            }),
          );
        }
      } else if (sisterCopy) {
        push(
          row({
            sourceFile: input.filename,
            locator: chunk.locator,
            locationCite: "(no paragraph cite)",
            sectionId: null,
            draftExcerpt: "",
            documentExcerpt: excerpt(chunk.text),
            verdict: "miss",
            reason: "Upload copies flag or separation procedures that should stay as See AR 600-8-2 / AR 635-200.",
          }),
        );
      }
      continue;
    }

    for (const cite of cites) {
      const locationCite = formatParaCite(cite.sectionKey, cite.suffix);
      const draftSection = lookupSection(cite.sectionKey, draft);
      const originalSection = lookupSection(cite.sectionKey, original);
      const documentExcerpt = excerptAround(chunk.text, cite.index, cite.raw.length);
      const localFlags = findTermFlags(documentExcerpt);
      const localSister = looksLikeSisterCopy(documentExcerpt) || (sisterCopy && sisterTopic(documentExcerpt));

      if (!draftSection && !originalSection) {
        push(
          row({
            sourceFile: input.filename,
            locator: chunk.locator,
            locationCite,
            sectionId: null,
            draftExcerpt: "",
            documentExcerpt,
            verdict: "miss",
            reason: "Upload points to a paragraph number that is not in your draft (wrong number).",
          }),
        );
        continue;
      }

      if (!draftSection || emptyBody(draftSection)) {
        push(
          row({
            sourceFile: input.filename,
            locator: chunk.locator,
            locationCite,
            sectionId: draftSection?.id ?? originalSection?.id ?? null,
            draftExcerpt: "",
            documentExcerpt,
            verdict: "miss",
            reason: "Upload still points to a rescinded paragraph. That location is empty in your draft.",
          }),
        );
        continue;
      }

      const units = unitMap(draftSection!.body);
      let unitText = cite.suffix ? units.get(cite.suffix) : undefined;
      if (cite.suffix && unitText == null) {
        push(
          row({
            sourceFile: input.filename,
            locator: chunk.locator,
            locationCite,
            sectionId: draftSection!.id,
            draftExcerpt: excerpt(draftSection!.body),
            documentExcerpt,
            verdict: "miss",
            reason: "Upload cites a subparagraph that is not in your draft at that location.",
          }),
        );
        continue;
      }
      unitText = unitText ?? draftSection!.body;
      const draftExcerpt = excerpt(unitText);

      let verdict: CrossmatchVerdict = "unclear";
      let reason = "Not enough overlapping wording to confirm a match. Review this row by hand.";

      if (localFlags.length) {
        verdict = "miss";
        reason = localFlags[0].reason;
      } else if (localSister) {
        verdict = "miss";
        reason = "Upload copies flag or separation procedures that should stay as See AR 600-8-2 / AR 635-200.";
      } else if (conflicts(documentExcerpt, unitText)) {
        verdict = "miss";
        reason = "Upload conflicts with your draft at this cited location.";
      } else if (missingRule(documentExcerpt, unitText)) {
        verdict = "miss";
        reason = "Upload requires a rule that is not in your draft at this paragraph.";
      } else if (agrees(documentExcerpt, unitText)) {
        verdict = "match";
        reason = sisterTopic(documentExcerpt) && hasCorrectSisterCite(documentExcerpt)
          ? "Upload cites the same location and correctly says See AR for the sister publication."
          : "Upload cites the same location and the rule agrees with your draft.";
      }

      push(
        row({
          sourceFile: input.filename,
          locator: chunk.locator,
          locationCite,
          sectionId: draftSection!.id,
          draftExcerpt,
          documentExcerpt,
          verdict,
          reason,
        }),
      );
    }
  }

  if (!rows.length) {
    const first = input.chunks[0];
    rows.push(
      row({
        sourceFile: input.filename,
        locator: first?.locator ?? "document",
        locationCite: "(no paragraph cite)",
        sectionId: null,
        draftExcerpt: "",
        documentExcerpt: excerpt(first?.text ?? ""),
        verdict: "unclear",
        reason: "No paragraph cites or locked-term issues were found. Review the upload by hand.",
      }),
    );
  }

  return rows;
}
