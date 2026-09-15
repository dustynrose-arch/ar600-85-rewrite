"use client";

import { compareSegments } from "@/lib/diff";
import {
  actionLabel,
  originalCell,
  revisedCell,
  SUMMARY_ADDS_ORIGINAL,
  SUMMARY_EXPORT_TITLE,
  SUMMARY_RESCINDS_REVISED,
  SUMMARY_TABLE_COLUMNS,
  type ChangeAction,
  type SummaryOfChangeResult,
  type SummaryOfChangeRow,
} from "@/lib/summary-of-change";
import type { ReactNode } from "react";

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
        ? "bg-army-olive/30 text-army-oliveDark"
        : action === "moves"
          ? "bg-army-raised text-army-slate"
          : "bg-army-rust/30 text-army-cream";
  return (
    <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${tone}`}>
      {actionLabel(action)}
    </span>
  );
}

function CompareMarks({
  original,
  revised,
  side,
}: {
  original: string;
  revised: string;
  side: "original" | "revised";
}): ReactNode {
  const ops = compareSegments(original, revised, side);
  const nodes: ReactNode[] = [];
  ops.forEach((op, index) => {
    if (op.type === "equal") {
      nodes.push(op.text);
      return;
    }
    if (op.type === "delete") {
      nodes.push(
        <span key={`del-${index}`} className="soc-del" data-soc-del="">
          {op.text}
        </span>,
      );
      return;
    }
    nodes.push(
      <span key={`ins-${index}`} className="soc-ins" data-soc-ins="">
        {op.text}
      </span>,
    );
  });
  return <>{nodes}</>;
}

function OriginalCompare({ row }: { row: SummaryOfChangeRow }) {
  if (row.action === "adds") {
    return <span className="text-army-slate italic">{SUMMARY_ADDS_ORIGINAL}</span>;
  }
  const original = originalCell(row);
  const revised = row.action === "rescinds" ? "" : revisedCell(row);
  if (row.action === "rescinds") {
    return (
      <span className="soc-del" data-soc-del="">
        {original}
      </span>
    );
  }
  return <CompareMarks original={original} revised={revised} side="original" />;
}

function RevisedCompare({ row }: { row: SummaryOfChangeRow }) {
  if (row.action === "rescinds") {
    return <span className="text-army-slate italic">{SUMMARY_RESCINDS_REVISED}</span>;
  }
  const original = row.action === "adds" ? "" : originalCell(row);
  const revised = revisedCell(row);
  if (row.action === "adds") {
    return (
      <span className="soc-ins" data-soc-ins="">
        {revised}
      </span>
    );
  }
  return <CompareMarks original={original} revised={revised} side="revised" />;
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
    <section className="flex flex-col min-h-0 h-full panel-surface">
      <header className="px-4 py-3 box-split-b flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="panel-heading">Summary of Change</p>
          <h2 className="font-doc text-xl font-semibold leading-snug">{SUMMARY_EXPORT_TITLE}</h2>
          <p className="text-[11px] text-army-slate mt-1">
            Deltas only. Gold marks wording added in your draft; rust strikethrough marks wording removed
            from the original. Location cites use regulation paragraph style. Structure and title changes
            appear as Adds, Rescinds, Moves, or Revises — not every body keystroke.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <a
            href="/api/export?kind=summary"
            className="btn-header"
          >
            Export Summary (DRAFT)
          </a>
        </div>
      </header>
      <div className="px-4 py-2 box-split-b flex flex-wrap items-center gap-2 text-[11px]">
        <button
          type="button"
          onClick={() => onFilter("all")}
          className={`rounded-lg px-2 py-1 border ${filter === "all" ? "bg-army-olive text-army-cream border-army-olive" : "btn-secondary !px-2 !py-1"}`}
        >
          All {summary.counts.total}
        </button>
        {ACTION_ORDER.map((action) => (
          <button
            key={action}
            onClick={() => onFilter(action)}
            type="button"
            className={`rounded-lg px-2 py-1 border ${filter === action ? "bg-army-olive text-army-cream border-army-olive" : "btn-secondary !px-2 !py-1"}`}
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
          <table className="w-full min-w-[720px] border-collapse text-[13px] font-doc bg-army-ink box-split">
            <caption className="sr-only">{SUMMARY_EXPORT_TITLE}</caption>
            <thead>
              <tr className="bg-army-olive text-army-cream text-left text-[11px] font-ui">
                {SUMMARY_TABLE_COLUMNS.map((label) => (
                  <th key={label} className="border-2 border-black px-2 py-1.5 font-semibold">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((row: SummaryOfChangeRow) => (
                <tr key={row.id} className="align-top" data-soc-row={row.action}>
                  <td className="border-2 border-black px-2 py-2 whitespace-nowrap">
                    <ActionBadge action={row.action} />
                  </td>
                  <td className="border-2 border-black px-2 py-2">
                    <button
                      type="button"
                      onClick={() => onOpenSection(row.sectionId)}
                      className="assist-link text-left"
                    >
                      {row.cite}
                    </button>
                    <div className="text-[11px] text-army-slate font-ui mt-0.5">
                      {row.sectionNumber} {row.sectionTitle}
                    </div>
                  </td>
                  <td className="border-2 border-black px-2 py-2 whitespace-pre-wrap max-w-[28rem]" data-soc-original="">
                    <OriginalCompare row={row} />
                  </td>
                  <td className="border-2 border-black px-2 py-2 whitespace-pre-wrap max-w-[28rem]" data-soc-revised="">
                    <RevisedCompare row={row} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-[11px] text-army-slate pt-3">
          Cross-chapter and same-chapter reorders appear as Moves. Inserts that only shift later display
          numbers do not. Title renames are Revises. New or deleted outline nodes are Adds or Rescinds.
          Word Summary export stays unmarked DRAFT text.
        </p>
      </div>
    </section>
  );
}
