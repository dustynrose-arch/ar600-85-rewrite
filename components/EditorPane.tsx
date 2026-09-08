"use client";

import { DraftEditor } from "@/components/DraftEditor";
import type { Role, Section, WorkingSection } from "@/lib/types";

type Props = {
  role: Role;
  locked: boolean;
  baseline: Section;
  working: WorkingSection;
  draft: string;
  saveState: "saved" | "saving" | "dirty" | "blocked";
  onChange: (value: string) => void;
  onSave: (value: string) => void;
  compareBody?: string;
  compareLabel?: string;
};

export function EditorPane({
  role,
  locked,
  baseline,
  working,
  draft,
  saveState,
  onChange,
  onSave,
  compareBody,
  compareLabel,
}: Props) {
  const editable = role === "editor" && !locked;
  const status =
    saveState === "saving"
      ? "Saving…"
      : saveState === "dirty"
        ? "Unsaved changes"
        : saveState === "blocked"
          ? "Read-only (role or lock)"
          : "Saved";

  return (
    <section className="flex flex-col min-h-0 h-full bg-army-paper">
      <header className="px-4 py-3 border-b border-army-black/10">
        <p className="text-[10px] font-bold tracking-[0.18em] text-army-goldDark">WORKING COPY</p>
        <h2 className="font-doc text-xl font-semibold">
          {working.number}. {working.title}
        </h2>
        <p className="text-[11px] text-army-slate">
          Last saved {new Date(working.updatedAt).toLocaleString()} · {status}
        </p>
      </header>
      <div className="grid grid-rows-2 min-h-0 flex-1">
        <div className="min-h-0 border-b border-army-black/10 flex flex-col">
          <p className="px-4 pt-2 text-[10px] font-bold tracking-[0.16em] text-army-slate">
            ORIGINAL REGULATION — READ ONLY
          </p>
          <div
            spellCheck={false}
            data-spellcheck="disabled"
            className="pane-scroll overflow-y-auto px-4 py-2 font-doc text-[13px] leading-relaxed text-army-ink/90 whitespace-pre-wrap"
          >
            {compareBody != null ? (
              <>
                <p className="text-[10px] font-ui font-bold tracking-wide text-army-goldDark mb-1">
                  COMPARISON: {compareLabel}
                </p>
                {compareBody}
              </>
            ) : (
              baseline.body
            )}
          </div>
        </div>
        <DraftEditor
          key={working.id}
          sectionId={working.id}
          value={draft}
          editable={editable}
          saveState={saveState}
          onChange={onChange}
          onSave={onSave}
        />
      </div>
    </section>
  );
}
