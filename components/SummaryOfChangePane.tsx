"use client";

import { PaneToggle } from "@/components/PaneToggle";
import {
  actionLabel,
  SUMMARY_EXPORT_TITLE,
  type ChangeAction,
  type SummaryOfChangeResult,
  type SummaryOfChangeRow,
} from "@/lib/summary-of-change";

const ACTION_ORDER: ChangeAction[] = ["revises", "adds", "rescinds"];

type Props = {
  summary: SummaryOfChangeResult;
  dirty: boolean;
  filter: ChangeAction | "all";
  onFilter: (value: ChangeAction | "all") => void;
  onOpenSection: (sectionId: string) => void;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
};

function ActionBadge({ action }: { action: ChangeAction }) {
  const tone =
    action === "revises"
      ? "bg-army-gold/25 text-army-goldDark"
      : action === "adds"
        ? "bg-army-olive/15 text-army-oliveDark"
        : "bg-army-rust/15 text-army-rust";
  return (
    <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${tone}`}>
      {actionLabel(action)}
    </span>
  );
}

function RowCard({ row, onOpenSection }: { row: SummaryOfChangeRow; onOpenSection: (id: string) => void }) {
  return (
    <article className="border border-army-black/10 bg-white p-3">
      <header className="flex flex-wrap items-center gap-2">
        <ActionBadge action={row.action} />
        <h3 className="font-doc font-semibold text-[15px]">{actionLabel(row.action)} {row.cite}.</h3>
      </header>
      <p className="text-[11px] text-army-slate mt-1">
        {row.sectionNumber} {row.sectionTitle}
      </p>
      {row.action === "revises" ? (
        <div className="grid md:grid-cols-2 gap-3 mt-3 text-[13px] font-doc">
          <div className="min-w-0">
            <p className="text-[10px] font-ui font-bold tracking-[0.14em] text-army-rust">
              ORIGINAL — ORIGINAL REGULATION (READ-ONLY)
            </p>
            <p className="mt-1 whitespace-pre-wrap max-h-48 overflow-y-auto pane-scroll leading-relaxed">
              {row.originalText}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-ui font-bold tracking-[0.14em] text-army-oliveDark">
              REVISED — YOUR DRAFT
            </p>
            <p className="mt-1 whitespace-pre-wrap max-h-48 overflow-y-auto pane-scroll leading-relaxed">
              {row.revisedText}
            </p>
          </div>
        </div>
      ) : null}
      {row.action === "adds" ? (
        <div className="mt-3 text-[13px] font-doc">
          <p className="text-[10px] font-ui font-bold tracking-[0.14em] text-army-oliveDark">ADDED IN YOUR DRAFT</p>
          <p className="mt-1 whitespace-pre-wrap max-h-48 overflow-y-auto pane-scroll leading-relaxed">
            {row.revisedText}
          </p>
        </div>
      ) : null}
      {row.action === "rescinds" ? (
        <div className="mt-3 text-[13px] font-doc">
          <p className="text-[10px] font-ui font-bold tracking-[0.14em] text-army-rust">
            REMOVED FROM THE ORIGINAL REGULATION
          </p>
          <p className="mt-1 whitespace-pre-wrap max-h-48 overflow-y-auto pane-scroll leading-relaxed">
            {row.originalText}
          </p>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => onOpenSection(row.sectionId)}
        className="mt-3 text-[12px] underline text-army-goldDark"
      >
        Open {row.cite} in your draft
      </button>
    </article>
  );
}

export function SummaryOfChangePane({
  summary,
  dirty,
  filter,
  onFilter,
  onOpenSection,
  leftCollapsed,
  rightCollapsed,
  onToggleLeft,
  onToggleRight,
}: Props) {
  const visible = filter === "all" ? summary.rows : summary.rows.filter((row) => row.action === filter);

  return (
    <section className="flex flex-col min-h-0 h-full bg-army-paper">
      <header className="px-4 py-3 border-b border-army-black/10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.18em] text-army-goldDark">SUMMARY OF CHANGE</p>
          <h2 className="font-doc text-xl font-semibold leading-snug">{SUMMARY_EXPORT_TITLE}</h2>
          <p className="text-[11px] text-army-slate mt-1">
            Deltas only between the original regulation (read-only) and your draft. This list updates as you
            edit.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <a
            href="/api/export?kind=summary"
            className="bg-army-gold text-army-black px-2 py-1 text-xs font-semibold"
          >
            Export Summary (DRAFT)
          </a>
          <PaneToggle label="outline" expanded={!leftCollapsed} onClick={onToggleLeft} />
          <PaneToggle label="Assist" expanded={!rightCollapsed} onClick={onToggleRight} />
        </div>
      </header>
      <div className="px-4 py-2 border-b border-army-black/10 flex flex-wrap items-center gap-2 text-[11px]">
        <button
          type="button"
          onClick={() => onFilter("all")}
          className={`px-2 py-1 border ${filter === "all" ? "bg-army-olive text-army-cream" : "bg-white"}`}
        >
          All {summary.counts.total}
        </button>
        {ACTION_ORDER.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => onFilter(action)}
            className={`px-2 py-1 border ${filter === action ? "bg-army-olive text-army-cream" : "bg-white"}`}
          >
            {actionLabel(action)} {summary.counts[action]}
          </button>
        ))}
        {dirty ? (
          <span className="text-army-rust">Includes unsaved edits in the open paragraph.</span>
        ) : (
          <span className="text-army-slate">Export uses the last saved draft and stays marked DRAFT.</span>
        )}
      </div>
      <div className="pane-scroll overflow-y-auto flex-1 min-h-0 p-4 space-y-3">
        {visible.length === 0 ? (
          <p className="text-sm text-army-slate">
            {summary.counts.total === 0
              ? "No wording differences between the original regulation (read-only) and your draft."
              : "No rows in this filter."}
          </p>
        ) : (
          visible.map((row) => <RowCard key={row.id} row={row} onOpenSection={onOpenSection} />)
        )}
        <p className="text-[11px] text-army-slate pt-2">
          Moved paragraphs (same wording, new location) are not listed separately yet. They appear as Rescinds
          at the old cite and Adds at the new cite.
        </p>
      </div>
    </section>
  );
}
