"use client";

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { loadDraftSpellEngine, type DraftSpellEngine } from "@/lib/draft-spell-engine";
import { insertRanges } from "@/lib/diff";
import {
  iterateWords,
  preserveWordShape,
  replaceWordAt,
  wordAtOffset,
} from "@/lib/draft-spellcheck";

type Props = {
  sectionId: string;
  value: string;
  original: string;
  editable: boolean;
  saveState: "saved" | "saving" | "dirty" | "blocked";
  onChange: (value: string) => void;
  onSave: (value: string) => void;
};

type SpellMenu = {
  x: number;
  y: number;
  start: number;
  end: number;
  word: string;
  suggestions: string[];
};

export function DraftEditor({ sectionId, value, original, editable, saveState, onChange, onSave }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<string[]>([]);
  const lastInputAt = useRef(0);
  const seedRef = useRef({ sectionId, text: value });
  const [canUndo, setCanUndo] = useState(false);
  const [liveText, setLiveText] = useState(value);
  const [engine, setEngine] = useState<DraftSpellEngine | null>(null);
  const [menu, setMenu] = useState<SpellMenu | null>(null);

  // Freeze defaultValue for this paragraph so React never rewrites the textarea
  // on keystroke/autosave (that still matters for caret/undo). Spell marks come
  // from the in-app overlay, not Chrome's native checker.
  if (seedRef.current.sectionId !== sectionId) {
    seedRef.current = { sectionId, text: value };
  }

  useEffect(() => {
    historyRef.current = [];
    lastInputAt.current = 0;
    setCanUndo(false);
    setLiveText(seedRef.current.text);
    setMenu(null);
  }, [sectionId]);

  useEffect(() => {
    let cancelled = false;
    void loadDraftSpellEngine()
      .then((next) => {
        if (!cancelled) setEngine(next);
      })
      .catch(() => {
        if (!cancelled) setEngine(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    syncOverlayBox();
  }, [liveText, engine, original]);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => syncOverlayBox());
    observer.observe(el);
    window.addEventListener("resize", syncOverlayBox);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncOverlayBox);
    };
  }, []);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("click", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  function syncOverlayBox() {
    const el = ref.current;
    const overlay = overlayRef.current;
    if (!el || !overlay) return;
    overlay.style.width = `${el.clientWidth}px`;
    overlay.style.height = `${el.clientHeight}px`;
    overlay.scrollTop = el.scrollTop;
    overlay.scrollLeft = el.scrollLeft;
  }

  function currentValue(): string {
    return ref.current?.value ?? liveText;
  }

  function pushHistory(previous: string) {
    const now = Date.now();
    if (now - lastInputAt.current > 400 || historyRef.current.length === 0) {
      historyRef.current.push(previous);
      if (historyRef.current.length > 80) historyRef.current.shift();
      setCanUndo(true);
    }
    lastInputAt.current = now;
  }

  function applyDraft(next: string, previous?: string) {
    if (previous != null) pushHistory(previous);
    if (ref.current) ref.current.value = next;
    setLiveText(next);
    onChange(next);
  }

  function undo() {
    if (!editable) return;
    const previous = historyRef.current.pop();
    if (previous == null) return;
    setCanUndo(historyRef.current.length > 0);
    if (ref.current) ref.current.value = previous;
    setLiveText(previous);
    setMenu(null);
    onChange(previous);
  }

  function openSpellMenu(event: MouseEvent<HTMLTextAreaElement>) {
    if (!editable || !engine) return;
    const el = event.currentTarget;
    const offset = el.selectionStart;
    if (el.selectionStart !== el.selectionEnd) return;
    const span = wordAtOffset(el.value, offset);
    if (!span || !engine.isMisspelled(span.word)) return;
    event.preventDefault();
    const pad = 8;
    const x = Math.min(event.clientX, window.innerWidth - 180);
    const y = Math.min(event.clientY, window.innerHeight - 160);
    setMenu({
      x: Math.max(pad, x),
      y: Math.max(pad, y),
      start: span.start,
      end: span.end,
      word: span.word,
      suggestions: engine.suggestions(span.word),
    });
  }

  function applySuggestion(suggestion: string) {
    if (!menu || !editable) return;
    const shaped = preserveWordShape(menu.word, suggestion);
    applyDraft(replaceWordAt(currentValue(), menu.start, menu.end, shaped), currentValue());
    setMenu(null);
    const caret = menu.start + shaped.length;
    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(caret, caret);
    });
  }

  return (
    <div className="min-h-0 flex flex-col flex-1" lang="en-US">
      <div className="px-4 pt-2 flex items-center justify-between gap-2">
        <p className="section-heading">Your draft</p>
        {editable ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="btn-secondary !text-[11px] !px-2 !py-0.5"
              title="Undo last change in your draft (Ctrl+Z / ⌘Z). Does not change the original regulation."
            >
              Undo
            </button>
            <button
              type="button"
              onClick={() => onSave(currentValue())}
              disabled={saveState === "saving"}
              className="btn-primary !text-[11px] !px-2 !py-0.5"
              title="Save your draft now. Autosave still runs. Does not change the original regulation."
            >
              Save
            </button>
          </div>
        ) : null}
      </div>
      <div className="relative flex-1 min-h-0 m-2 box-split bg-army-ink">
        <div
          ref={overlayRef}
          aria-hidden
          className="draft-spell-overlay absolute top-0 left-0 overflow-hidden p-3 font-doc text-[14px] leading-relaxed pointer-events-none"
          data-spell-overlay="draft"
          data-delta-overlay="draft"
        >
          <DraftMarks text={liveText} original={original} engine={engine} />
        </div>
        <textarea
          key={sectionId}
          ref={ref}
          id="draft-editor"
          name="draft-editor"
          defaultValue={seedRef.current.text}
          readOnly={!editable}
          spellCheck={false}
          lang="en-US"
          autoCorrect="off"
          autoCapitalize="sentences"
          autoComplete="off"
          wrap="soft"
          aria-label="Your draft"
          data-spellcheck="app"
          data-spell-ready={engine ? "true" : "false"}
          onChange={(event) => {
            pushHistory(value);
            setLiveText(event.target.value);
            setMenu(null);
            onChange(event.target.value);
          }}
          onScroll={syncOverlayBox}
          onContextMenu={openSpellMenu}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "z" && !event.shiftKey) {
              event.preventDefault();
              undo();
            }
          }}
          className="absolute inset-0 z-[1] w-full h-full p-3 border-0 bg-transparent font-doc text-[14px] leading-relaxed resize-none overflow-y-auto caret-army-cream"
        />
      </div>
      {menu ? (
        <div
          role="menu"
          data-spell-menu=""
          className="fixed z-[90] min-w-[12rem] menu-surface py-1"
          style={{ left: menu.x, top: menu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <p className="px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-army-slate">SPELLING</p>
          {menu.suggestions.length === 0 ? (
            <p className="px-3 py-1.5 text-xs text-army-slate">No suggestions</p>
          ) : (
            menu.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                role="menuitem"
                className="block w-full px-3 py-1 text-left text-sm hover:bg-army-gold/20"
                onClick={() => applySuggestion(suggestion)}
              >
                {preserveWordShape(menu.word, suggestion)}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function DraftMarks({
  text,
  original,
  engine,
}: {
  text: string;
  original: string;
  engine: DraftSpellEngine | null;
}) {
  const ranges = insertRanges(original, text);
  const misspelled: { start: number; end: number; word: string }[] = [];
  if (engine) {
    for (const span of iterateWords(text)) {
      if (engine.isMisspelled(span.word)) misspelled.push(span);
    }
  }
  const points = new Set<number>([0, text.length]);
  for (const range of ranges) {
    points.add(range.start);
    points.add(range.end);
  }
  for (const span of misspelled) {
    points.add(span.start);
    points.add(span.end);
  }
  const sorted = [...points].sort((a, b) => a - b);
  const nodes: ReactNode[] = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const start = sorted[i];
    const end = sorted[i + 1];
    if (start >= end) continue;
    const slice = text.slice(start, end);
    const delta = ranges.some((range) => start >= range.start && end <= range.end);
    const miss = misspelled.find((span) => start >= span.start && end <= span.end);
    const className = [delta ? "draft-delta" : "", miss ? "draft-misspelled" : ""].filter(Boolean).join(" ");
    if (className) {
      nodes.push(
        <span
          key={`${start}-${end}`}
          className={className}
          data-draft-delta={delta ? slice : undefined}
          data-misspelled={miss ? miss.word : undefined}
        >
          {slice}
        </span>,
      );
    } else {
      nodes.push(slice);
    }
  }
  return <>{nodes}</>;
}
