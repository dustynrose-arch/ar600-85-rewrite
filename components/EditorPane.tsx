"use client";

import { useLayoutEffect, useRef } from "react";
import { DraftEditor } from "@/components/DraftEditor";
import { SearchHighlight, scrollHitIntoContainer } from "@/components/SearchHighlight";
import { normalizedSearchQuery } from "@/lib/search-highlight";
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
  searchQuery?: string;
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
  searchQuery = "",
}: Props) {
  const editable = role === "editor" && !locked;
  const originalRef = useRef<HTMLDivElement>(null);
  const query = normalizedSearchQuery(searchQuery);
  const originalBody = compareBody ?? baseline.body;
  const status =
    saveState === "saving"
      ? "Saving…"
      : saveState === "dirty"
        ? "Unsaved changes"
        : saveState === "blocked"
          ? "Read-only (role or lock)"
          : "Saved";

  useLayoutEffect(() => {
    if (!query) return;
    const first = originalRef.current?.querySelector<HTMLElement>('[data-search-hit="first"]');
    scrollHitIntoContainer(originalRef.current, first ?? null);
  }, [query, working.id, originalBody]);

  return (
    <section className="flex flex-col min-h-0 h-full bg-army-paper">
      <header className="px-4 py-3 border-b border-army-black/10">
        <p className="pane-title">WORKING COPY</p>
        <h2 className="font-doc text-xl font-semibold">
          {query ? (
            <SearchHighlight text={`${working.number}. ${working.title}`} query={query} />
          ) : (
            <>
              {working.number}. {working.title}
            </>
          )}
        </h2>
        <p className="text-[11px] text-army-slate">
          Last saved {new Date(working.updatedAt).toLocaleString()} · {status}
        </p>
      </header>
      <div className="grid grid-rows-[minmax(9rem,1fr)_minmax(14rem,2fr)] min-h-0 flex-1 overflow-hidden">
        <div className="min-h-0 border-b border-army-black/10 flex flex-col overflow-hidden">
          <p className="px-4 pt-2 pane-title">
            ORIGINAL REGULATION — READ ONLY
          </p>
          <div
            ref={originalRef}
            spellCheck={false}
            data-spellcheck="disabled"
            className="pane-scroll overflow-y-auto flex-1 min-h-0 px-4 py-2 font-doc text-[13px] leading-relaxed text-army-ink/90 whitespace-pre-wrap"
          >
            {compareBody != null ? (
              <>
                <p className="text-[10px] font-ui font-bold tracking-wide text-army-goldDark mb-1">
                  COMPARISON: {compareLabel}
                </p>
                {query ? <SearchHighlight text={compareBody} query={query} /> : compareBody}
              </>
            ) : query ? (
              <SearchHighlight text={baseline.body} query={query} />
            ) : (
              baseline.body
            )}
          </div>
        </div>
        <DraftEditor
          sectionId={working.id}
          value={draft}
          editable={editable}
          saveState={saveState}
          onChange={onChange}
          onSave={onSave}
          searchQuery={query}
        />
      </div>
    </section>
  );
}
