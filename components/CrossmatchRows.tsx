"use client";

import type { CrossmatchRow, CrossmatchVerdict } from "@/lib/types";

const VERDICT_STYLE: Record<CrossmatchVerdict, string> = {
  match: "bg-army-olive text-white",
  miss: "bg-army-rust text-white",
  unclear: "bg-army-gold text-army-black",
};

const VERDICT_LABEL: Record<CrossmatchVerdict, string> = {
  match: "Match",
  miss: "Miss",
  unclear: "Unclear",
};

type Props = {
  rows: CrossmatchRow[];
  onSelect: (id: string) => void;
};

export function CrossmatchRows({ rows, onSelect }: Props) {
  if (!rows.length) {
    return <p className="text-[11px] text-army-slate">No compare rows yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.id} className="border border-army-black/10 bg-white p-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`rounded-lg px-1.5 py-0.5 font-bold ${VERDICT_STYLE[row.verdict]}`}>
              {VERDICT_LABEL[row.verdict]}
            </span>
            <span className="font-semibold">{row.locationCite}</span>
          </div>
          <p className="mt-1 text-army-slate">
            {row.sourceFile} · {row.locator}
          </p>
          {row.draftExcerpt ? (
            <p className="mt-1">
              <span className="font-semibold text-army-oliveDark">Your draft: </span>
              {row.draftExcerpt}
            </p>
          ) : null}
          {row.documentExcerpt ? (
            <p className="mt-1">
              <span className="font-semibold">Upload: </span>
              {row.documentExcerpt}
            </p>
          ) : null}
          <p className="mt-1">{row.reason}</p>
          {row.sectionId ? (
            <button type="button" className="btn-secondary btn-sm mt-1" onClick={() => onSelect(row.sectionId!)}>
              Open in your draft
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
