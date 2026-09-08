"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  sectionId: string;
  value: string;
  editable: boolean;
  onChange: (value: string) => void;
};

export function DraftEditor({ sectionId, value, editable, onChange }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<string[]>([]);
  const lastInputAt = useRef(0);
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => {
    historyRef.current = [];
    lastInputAt.current = 0;
    setCanUndo(false);
  }, [sectionId]);

  useEffect(() => {
    const el = ref.current;
    if (el && el.value !== value) el.value = value;
  }, [value, sectionId]);

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
    <div className="min-h-0 flex flex-col flex-1">
      <div className="px-4 pt-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold tracking-[0.16em] text-army-oliveDark">YOUR DRAFT</p>
        {editable ? (
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="text-[11px] px-2 py-0.5 border border-army-black/20 bg-white disabled:opacity-40"
            title="Undo last change in your draft (Ctrl+Z / ⌘Z). Does not change the original regulation."
          >
            Undo
          </button>
        ) : null}
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
