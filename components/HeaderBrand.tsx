/** Always render both seals with the header DRAFT chip. Never seals alone. No hide control. */

export const HEADER_TITLE = "AR 600-85 Rewrite";
export const HEADER_SUBTITLE = "Directorate of Prevention, Resilience and Readiness";

export function headerDraftMark(training: boolean): string {
  return training ? "TRAINING / DRAFT" : "DRAFT";
}

export function HeaderBrand({
  title = HEADER_TITLE,
  detail,
  training,
}: {
  title?: string;
  detail?: string;
  training: boolean;
}) {
  const mark = headerDraftMark(training);
  return (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <img
        src="/g1-seal.png"
        alt="Office of the Deputy Chief of Staff, G-1, United States Army seal"
        className="h-12 w-12 shrink-0 rounded-full object-contain ring-2 ring-army-gold/80 bg-army-cream/15"
      />
      <div className="min-w-0 max-w-[28rem]">
        <h1 className="text-lg font-semibold leading-tight text-army-cream">{title}</h1>
        <p className="text-xs text-army-goldDark">{HEADER_SUBTITLE}</p>
        {detail ? <p className="text-[11px] text-army-cream/80">{detail}</p> : null}
      </div>
      <img
        src="/army-seal.png"
        alt="United States Army emblem (official Department of the Army emblem)"
        className="h-12 w-12 shrink-0 object-contain ring-2 ring-army-gold/80 bg-army-cream/15"
      />
      <span
        data-draft-mark=""
        role="status"
        aria-label={training ? "Training draft" : "Draft"}
        className="header-draft-mark"
      >
        {mark}
      </span>
      <div className="flex-1 min-w-2" aria-hidden />
    </div>
  );
}
