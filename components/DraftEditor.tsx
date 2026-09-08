"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Props = {
  sectionId: string;
  value: string;
  editable: boolean;
  saveState: "saved" | "saving" | "dirty" | "blocked";
  onChange: (value: string) => void;
  onSave: (value: string) => void;
};

export function DraftEditor({ sectionId, value, editable, saveState, onChange, onSave }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<string[]>([]);
  const lastInputAt = useRef(0);
  const seedRef = useRef({ sectionId, text: value });
  const [canUndo, setCanUndo] = useState(false);

  // Freeze defaultValue for this paragraph. Passing the live draft back as
  // defaultValue makes React rewrite textarea.defaultValue on every keystroke
  // and autosave; Chrome then treats the field as programmatically edited and
  // never paints native spellcheck underlines.
  if (seedRef.current.sectionId !== sectionId) {
    seedRef.current = { sectionId, text: value };
  }

  useEffect(() => {
    historyRef.current = [];
    lastInputAt.current = 0;
    setCanUndo(false);
  }, [sectionId]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.lang = "en-US";
    el.setAttribute("lang", "en-US");
    el.setAttribute("spellcheck", "true");
    el.spellcheck = true;
  }, [sectionId, editable]);

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
    <div className="min-h-0 flex flex-col flex-1" lang="en-US" spellCheck={true}>
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
      <textarea
        key={sectionId}
        ref={ref}
        id="draft-editor"
        name="draft-editor"
        defaultValue={seedRef.current.text}
        readOnly={!editable}
        spellCheck={true}
        lang="en-US"
        autoCorrect="on"
        autoCapitalize="sentences"
        autoComplete="off"
        wrap="soft"
        aria-label="Your draft"
        data-spellcheck="enabled"
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
        className="flex-1 min-h-0 m-3 p-3 border border-army-black/15 bg-white font-doc text-[14px] leading-relaxed resize-none disabled:bg-army-cream"
      />
    </div>
  );
}
