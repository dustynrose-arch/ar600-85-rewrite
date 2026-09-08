"use client";

import {
  actionLabel,
  originalCell,
  revisedCell,
  SUMMARY_EXPORT_TITLE,
  SUMMARY_TABLE_COLUMNS,
  type ChangeAction,
  type SummaryOfChangeResult,
  type SummaryOfChangeRow,
} from "@/lib/summary-of-change";

const ACTION_ORDER: ChangeAction[] = ["revises", "adds", "rescinds", "moves"];

type Props = {
  summary: SummaryOfChangeResult;
  dirty: boolean;
  filter: ChangeAction | "all";
  onFilter: (value: ChangeAction | "all") => void;
  onOpenSection: (sectionId: string) => void;
};

function ActionBadge({ action }: { action: ChangeAction }) {
  const tone =
    action === "revises"
      ? "bg-army-gold/25 text-army-goldDark"
      : action === "adds"
        ? "bg-army-olive/15 text-army-oliveDark"
        : action === "moves"
          ? "bg-army-slate/15 text-army-slate"
          : "bg-army-rust/15 text-army-rust";
  return (
    <span className={`inline-block rounded-lg px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${tone}`}>
      {actionLabel(action)}
    </span>
  );
}

export function SummaryOfChangePane({
  summary,
  dirty,
  filter,
  onFilter,
  onOpenSection,
}: Props) {
  const visible = filter === "all" ? summary.rows : summary.rows.filter((row) => row.action === filter);

  return (
    <section className="flex flex-col min-h-0 h-full bg-army-paper">
      <header className="px-4 py-3 border-b border-army-black/10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="pane-title">SUMMARY OF CHANGE</p>
          <h2 className="font-doc text-xl font-semibold leading-snug">{SUMMARY_EXPORT_TITLE}</h2>
          <p className="text-[11px] text-army-slate mt-1">
            Deltas only. Location cites use regulation paragraph style. Original is the original regulation
            (read-only); Revised is your draft. Structure and title changes appear as Adds, Rescinds, Moves,
            or Revises — not every body keystroke.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <a
            href="/api/export?kind=summary"
            className="btn-primary btn-sm"
          >
            Export Summary (DRAFT)
          </a>
        </div>
      </header>
      <div className="px-4 py-2 border-b border-army-black/10 flex flex-wrap items-center gap-2 text-[11px]">
        <button
          type="button"
          onClick={() => onFilter("all")}
          className={`btn-sm ${filter === "all" ? "btn-primary" : "btn-secondary"}`}
        >
          All {summary.counts.total}
        </button>
        {ACTION_ORDER.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => onFilter(action)}
            className={`btn-sm ${filter === action ? "btn-primary" : "btn-secondary"}`}
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
      <div className="pane-scroll overflow-auto flex-1 min-h-0 p-4">
        {visible.length === 0 ? (
          <p className="text-sm text-army-slate">
            {summary.counts.total === 0
              ? "No wording or structure differences between the original regulation (read-only) and your draft."
              : "No rows in this filter."}
          </p>
        ) : (
          <table className="w-full min-w-[720px] border-collapse text-[13px] font-doc bg-white">
            <caption className="sr-only">{SUMMARY_EXPORT_TITLE}</caption>
            <thead>
              <tr className="bg-army-olive text-army-cream text-left text-[11px] font-ui">
                {SUMMARY_TABLE_COLUMNS.map((label) => (
                  <th key={label} className="border border-army-black/20 px-2 py-1.5 font-semibold">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((row: SummaryOfChangeRow) => (
                <tr key={row.id} className="align-top">
                  <td className="border border-army-black/15 px-2 py-2 whitespace-nowrap">
                    <ActionBadge action={row.action} />
                  </td>
                  <td className="border border-army-black/15 px-2 py-2">
                    <button
                      type="button"
                      onClick={() => onOpenSection(row.sectionId)}
                      className="btn-secondary btn-sm text-left"
                    >
                      {row.cite}
                    </button>
                    <div className="text-[11px] text-army-slate font-ui mt-0.5">
                      {row.sectionNumber} {row.sectionTitle}
                    </div>
                  </td>
                  <td className="border border-army-black/15 px-2 py-2 whitespace-pre-wrap max-w-[28rem]">
                    {originalCell(row)}
                  </td>
                  <td className="border border-army-black/15 px-2 py-2 whitespace-pre-wrap max-w-[28rem]">
                    {revisedCell(row)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-[11px] text-army-slate pt-3">
          Cross-chapter and same-chapter reorders appear as Moves. Inserts that only shift later display
          numbers do not. Title renames are Revises. New or deleted outline nodes are Adds or Rescinds.
        </p>
      </div>
    </section>
  );
}
