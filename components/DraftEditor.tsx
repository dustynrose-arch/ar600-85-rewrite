"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SearchHighlight } from "@/components/SearchHighlight";
import { normalizedSearchQuery } from "@/lib/search";

type Props = {
  sectionId: string;
  value: string;
  editable: boolean;
  saveState: "saved" | "saving" | "dirty" | "blocked";
  onChange: (value: string) => void;
  onSave: (value: string) => void;
  searchQuery?: string;
};

export function DraftEditor({
  sectionId,
  value,
  editable,
  saveState,
  onChange,
  onSave,
  searchQuery = "",
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<string[]>([]);
  const lastInputAt = useRef(0);
  const [canUndo, setCanUndo] = useState(false);
  const query = normalizedSearchQuery(searchQuery);
  const highlighting = Boolean(query);

  useEffect(() => {
    historyRef.current = [];
    lastInputAt.current = 0;
    setCanUndo(false);
  }, [sectionId]);

  useEffect(() => {
    const el = ref.current;
    if (el && el.value !== value) el.value = value;
  }, [value, sectionId]);

  const syncBackdrop = () => {
    const el = ref.current;
    const backdrop = backdropRef.current;
    if (!el || !backdrop) return;
    backdrop.scrollTop = el.scrollTop;
    backdrop.scrollLeft = el.scrollLeft;
  };

  useLayoutEffect(() => {
    syncBackdrop();
    if (!highlighting) return;
    const el = ref.current;
    const backdrop = backdropRef.current;
    const first = backdrop?.querySelector<HTMLElement>('[data-search-hit="first"]');
    if (!el || !backdrop || !first) return;
    const top = Math.max(0, first.offsetTop - el.clientHeight / 3);
    el.scrollTop = top;
    backdrop.scrollTop = top;
  }, [sectionId, query, value, highlighting]);

  function currentValue(): string {
    return ref.current?.value ?? value;
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

  function undo() {
    if (!editable) return;
    const previous = historyRef.current.pop();
    if (previous == null) return;
    setCanUndo(historyRef.current.length > 0);
    if (ref.current) ref.current.value = previous;
    onChange(previous);
  }

  return (
    <div className="min-h-0 h-full flex flex-col flex-1">
      <div className="px-4 pt-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold tracking-[0.16em] text-army-oliveDark">YOUR DRAFT</p>
        {editable ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="text-[11px] px-2 py-0.5 border border-army-black/20 bg-white disabled:opacity-40"
              title="Undo last change in your draft (Ctrl+Z / ⌘Z). Does not change the original regulation."
            >
              Undo
            </button>
            <button
              type="button"
              onClick={() => onSave(currentValue())}
              disabled={saveState === "saving"}
              className="text-[11px] px-2 py-0.5 bg-army-olive text-army-cream disabled:opacity-40"
              title="Save your draft now. Autosave still runs. Does not change the original regulation."
            >
              Save
            </button>
          </div>
        ) : null}
      </div>
      <div className="search-highlight-wrap relative flex-1 min-h-0 h-full m-3 border border-army-black/15 bg-white">
        <div
          ref={backdropRef}
          aria-hidden
          className="search-highlight-backdrop absolute inset-0 p-3 font-doc text-[14px] leading-relaxed whitespace-pre-wrap break-words"
        >
          {highlighting ? <SearchHighlight text={`${value}\n`} query={query} /> : null}
        </div>
        <textarea
          key={sectionId}
          ref={ref}
          id="draft-editor"
          name="draft-editor"
          defaultValue={value}
          readOnly={!editable}
          spellCheck={true}
          lang="en-US"
          autoCorrect="on"
          autoCapitalize="sentences"
          autoComplete="off"
          wrap="soft"
          aria-label="Your draft"
          data-spellcheck="enabled"
          onScroll={syncBackdrop}
          onChange={(event) => {
            pushHistory(value);
            onChange(event.target.value);
          }}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "z" && !event.shiftKey) {
              event.preventDefault();
              undo();
            }
          }}
          className={`relative z-10 w-full h-full min-h-0 p-3 font-doc text-[14px] leading-relaxed resize-none overflow-auto disabled:bg-army-cream ${
            highlighting ? "search-highlighting" : "bg-white"
          }`}
        />
      </div>
    </div>
  );
}
