import { GLOSSARY_TERMS } from "./seed/glossary.ts";

/** Letter-run tokens, including simple possessives / contractions. */
export const DRAFT_WORD_RE = /[A-Za-z][A-Za-z']*/g;

const EXTRA_KNOWN = new Set<string>([
  "iaw",
  "ucmj",
  "hqda",
  "dod",
  "g1",
  "dapam",
  "webdtp",
  "sudcc",
  "ftdtl",
  "damis",
  "dprr",
  "udl",
]);

for (const term of GLOSSARY_TERMS) {
  if (term.acronym) EXTRA_KNOWN.add(term.acronym.replace(/[^A-Za-z]/g, "").toLowerCase());
  for (const part of term.term.split(/[^A-Za-z]+/)) {
    if (part.length >= 2) EXTRA_KNOWN.add(part.toLowerCase());
  }
}

export function extraKnownWords(): string[] {
  return [...EXTRA_KNOWN];
}

export function isTitleCase(word: string): boolean {
  if (!word) return false;
  return word === word[0].toUpperCase() + word.slice(1).toLowerCase();
}

/** Skip acronyms, digits, and 1-letter tokens so regulation citations stay quiet. */
export function shouldCheckWord(word: string): boolean {
  if (word.length < 2) return false;
  if (/\d/.test(word)) return false;
  if (word === word.toUpperCase()) return false;
  if (/[A-Z]/.test(word.slice(1)) && !isTitleCase(word)) return false;
  return true;
}

export function stemForCheck(word: string): string {
  if (/^[A-Za-z]+'s$/i.test(word)) return word.slice(0, -2);
  return word;
}

export type WordSpan = {
  word: string;
  start: number;
  end: number;
};

export function iterateWords(text: string): WordSpan[] {
  const spans: WordSpan[] = [];
  const re = new RegExp(DRAFT_WORD_RE.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    spans.push({ word: match[0], start: match.index, end: match.index + match[0].length });
  }
  return spans;
}

export function wordAtOffset(text: string, offset: number): WordSpan | null {
  for (const span of iterateWords(text)) {
    if (offset >= span.start && offset <= span.end) return span;
  }
  return null;
}

export function replaceWordAt(text: string, start: number, end: number, next: string): string {
  return text.slice(0, start) + next + text.slice(end);
}

export function preserveWordShape(original: string, suggestion: string): string {
  if (!original) return suggestion;
  if (original === original.toUpperCase()) return suggestion.toUpperCase();
  if (isTitleCase(original)) {
    return suggestion ? suggestion[0].toUpperCase() + suggestion.slice(1) : suggestion;
  }
  return suggestion;
}
