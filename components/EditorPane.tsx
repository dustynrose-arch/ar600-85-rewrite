"use client";

import type { Role, Section, WorkingSection } from "@/lib/types";

type Props = {
  role: Role;
  locked: boolean;
  baseline: Section;
  working: WorkingSection;
  draft: string;
  saveState: "saved" | "saving" | "dirty" | "blocked";
  onChange: (value: string) => void;
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
  compareBody,
  compareLabel,
}: Props) {
  const editable = role === "editor" && !locked;
  const status =
    saveState === "saving"
      ? "Saving to server…"
      : saveState === "dirty"
        ? "Unsaved changes"
        : saveState === "blocked"
          ? "Read-only (role or lock)"
          : "Saved on server";

  return (
    <section className="flex flex-col min-h-0 bg-army-paper">
      <header className="px-4 py-3 border-b border-army-black/10 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-[0.18em] text-army-goldDark">WORKING COPY</p>
          <h2 className="font-doc text-xl font-semibold">
            {working.number}. {working.title}
          </h2>
          <p className="text-[11px] text-army-slate">
            Last server save {new Date(working.updatedAt).toLocaleString()} · {status}
          </p>
        </div>
      </header>
      <div className="grid grid-rows-2 min-h-0 flex-1">
        <div className="min-h-0 border-b border-army-black/10 flex flex-col">
          <p className="px-4 pt-2 text-[10px] font-bold tracking-[0.16em] text-army-slate">
            LOCKED BASELINE — READ ONLY
          </p>
          <div className="pane-scroll overflow-y-auto px-4 py-2 font-doc text-[13px] leading-relaxed text-army-ink/90 whitespace-pre-wrap">
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
        <div className="min-h-0 flex flex-col">
          <p className="px-4 pt-2 text-[10px] font-bold tracking-[0.16em] text-army-oliveDark">
            EDITABLE WORKING COPY
          </p>
          <textarea
            value={draft}
            onChange={(event) => onChange(event.target.value)}
            readOnly={!editable}
            className="flex-1 min-h-0 m-3 p-3 border border-army-black/15 bg-white font-doc text-[14px] leading-relaxed resize-none disabled:bg-army-cream"
            spellCheck
          />
        </div>
      </div>
    </section>
  );
}
