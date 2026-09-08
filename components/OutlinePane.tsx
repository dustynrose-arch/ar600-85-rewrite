"use client";

import { PaneToggle } from "@/components/PaneToggle";
import { SUMMARY_VIEW_ID } from "@/lib/summary-of-change";
import type { BaselineDocument, SearchHit } from "@/lib/types";

type Props = {
  baseline: BaselineDocument;
  selectedId: string;
  onSelect: (id: string) => void;
  query: string;
  onQuery: (value: string) => void;
  hits: SearchHit[];
  searching: boolean;
  changedIds: Set<string>;
  markedIds: Set<string>;
  changeCount: number;
  onCollapse: () => void;
};

export function OutlinePane({
  baseline,
  selectedId,
  onSelect,
  query,
  onQuery,
  hits,
  searching,
  changedIds,
  markedIds,
  changeCount,
  onCollapse,
}: Props) {
  return (
    <aside className="flex flex-col min-h-0 h-full border-r border-army-black/15 bg-[#efe8d8]">
      <div className="p-3 border-b border-army-black/10">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-[10px] font-bold tracking-[0.16em] text-army-slate">OUTLINE</p>
          <PaneToggle label="outline" expanded onClick={onCollapse} />
        </div>
        <label className="text-[10px] font-bold tracking-[0.16em] text-army-slate block mb-1">
          SEARCH ORIGINAL REGULATION
        </label>
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search AR 600-85"
          className="w-full border border-army-black/20 bg-army-paper px-2 py-1.5 text-sm"
        />
        {searching ? <p className="text-[11px] text-army-slate mt-1">Searching…</p> : null}
      </div>
      <div className="pane-scroll overflow-y-auto flex-1 min-h-0">
        {query.trim() ? (
          <ul className="p-2 space-y-2">
            {hits.length === 0 && !searching ? (
              <li className="text-xs text-army-slate px-1">No matching sections.</li>
            ) : null}
            {hits.map((hit) => (
              <li key={hit.sectionId}>
                <button
                  type="button"
                  onClick={() => onSelect(hit.sectionId)}
                  className={`w-full text-left px-2 py-1.5 text-xs border ${
                    selectedId === hit.sectionId ? "bg-army-gold/30 border-army-gold" : "bg-army-paper/80 border-transparent"
                  }`}
                >
                  <div className="font-semibold">
                    {hit.number} {hit.title}
                  </div>
                  <div className="text-[10px] text-army-slate">{hit.chapterLabel}</div>
                  <div className="mt-1 text-army-ink/80">{hit.snippet}</div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <nav className="py-2">
            <div className="px-2 mb-2">
              <button
                type="button"
                onClick={() => onSelect(SUMMARY_VIEW_ID)}
                className={`w-full text-left px-2 py-2 text-[12px] leading-snug border ${
                  selectedId === SUMMARY_VIEW_ID
                    ? "bg-army-gold/35 font-semibold border-army-gold"
                    : "bg-army-paper/90 border-army-black/10 hover:bg-army-gold/15"
                }`}
              >
                <span className="block text-[10px] font-bold tracking-[0.16em] text-army-goldDark">
                  FRONT MATTER
                </span>
                Summary of Change
                <span className="ml-1 text-[10px] text-army-rust font-bold">DRAFT</span>
                <span className="block text-[10px] text-army-slate font-normal mt-0.5">
                  {changeCount === 0
                    ? "No deltas yet — original vs your draft"
                    : `${changeCount} delta${changeCount === 1 ? "" : "s"} — original vs your draft`}
                </span>
              </button>
            </div>
            {baseline.chapters.map((chapter) => (
              <details key={chapter.id} open={chapter.id === "1" || chapter.id === "7" || chapter.id === "10"} className="px-2">
                <summary className="cursor-pointer text-[11px] font-bold tracking-wide text-army-oliveDark py-1">
                  {chapter.label}. {chapter.title}
                </summary>
                <ul className="mb-2">
                  {chapter.sections.map((section) => {
                    const changed = changedIds.has(section.id);
                    const marked = markedIds.has(section.id);
                    return (
                      <li key={section.id}>
                        <button
                          type="button"
                          onClick={() => onSelect(section.id)}
                          className={`w-full text-left px-2 py-1 text-[12px] leading-snug ${
                            selectedId === section.id ? "bg-army-gold/35 font-semibold" : "hover:bg-army-gold/15"
                          }`}
                        >
                          <span className="text-army-goldDark mr-1">{section.number}</span>
                          {section.title}
                          {changed ? <span className="ml-1 text-[10px] text-army-rust">●</span> : null}
                          {marked ? <span className="ml-1 text-[10px] text-army-olive">WG</span> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </details>
            ))}
          </nav>
        )}
      </div>
    </aside>
  );
}
