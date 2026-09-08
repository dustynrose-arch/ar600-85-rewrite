import nspell from "nspell";
import { extraKnownWords, shouldCheckWord, stemForCheck } from "./draft-spellcheck.ts";

export type DraftSpellEngine = {
  isMisspelled: (word: string) => boolean;
  suggestions: (word: string) => string[];
};

let loadPromise: Promise<DraftSpellEngine> | null = null;

function buildEngine(aff: string, dic: string): DraftSpellEngine {
  const spell = nspell(aff, dic);
  for (const word of extraKnownWords()) spell.add(word);
  return {
    isMisspelled(word: string) {
      if (!shouldCheckWord(word)) return false;
      const stem = stemForCheck(word);
      if (EXTRA_LOOKUP.has(stem.toLowerCase())) return false;
      return !spell.correct(stem);
    },
    suggestions(word: string) {
      const stem = stemForCheck(word);
      return spell.suggest(stem).slice(0, 6);
    },
  };
}

const EXTRA_LOOKUP = new Set(extraKnownWords().map((word) => word.toLowerCase()));

export function createDraftSpellEngine(aff: string, dic: string): DraftSpellEngine {
  return buildEngine(aff, dic);
}

export function loadDraftSpellEngine(fetchImpl: typeof fetch = fetch): Promise<DraftSpellEngine> {
  if (!loadPromise) {
    loadPromise = Promise.all([
      fetchImpl("/spellcheck/en.aff").then((res) => {
        if (!res.ok) throw new Error("spellcheck affix missing");
        return res.text();
      }),
      fetchImpl("/spellcheck/en.dic").then((res) => {
        if (!res.ok) throw new Error("spellcheck dictionary missing");
        return res.text();
      }),
    ]).then(([aff, dic]) => buildEngine(aff, dic));
  }
  return loadPromise;
}

export function resetDraftSpellEngineForTests(): void {
  loadPromise = null;
}
