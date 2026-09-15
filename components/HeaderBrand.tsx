/** Always render both seals with the header DRAFT / TRAINING·DRAFT mark. Never seals alone.
 *  No hide control. Army seal has no decorative box/ring. Do not crop or recolor the emblem files.
 *  Brand cluster is shrink-0: title + DPRR stay one horizontal row between the seals.
 *  Dual seals + the plain-text DRAFT / TRAINING·DRAFT mark stay visible; wrap or compress actions
 *  to the right — never overflow-x scroll the brand off-screen.
 *  Justice: on-screen mark is plain text (no fill). High-contrast on the dark bar. Never a
 *  button, never an authenticated-AR look. Word export stamps stay in lib/export-stamps.ts. */

export const HEADER_TITLE = "AR 600-85 Rewrite";
export const HEADER_SUBTITLE = "Directorate of Prevention, Resilience and Readiness";

export function headerDraftMark(training: boolean): string {
  return training ? "TRAINING·DRAFT" : "DRAFT";
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
    <div className="header-brand flex items-center gap-2.5 shrink-0">
      <img
        src="/g1-seal.png"
        alt="Office of the Deputy Chief of Staff, G-1, United States Army seal"
        className="h-10 w-10 shrink-0 rounded-full object-contain"
      />
      <div className="header-brand-titles flex items-baseline gap-2 whitespace-nowrap">
        <h1 className="text-base font-semibold leading-none text-army-cream">{title}</h1>
        <p className="text-xs leading-none text-army-goldDark">{HEADER_SUBTITLE}</p>
        {detail ? <p className="text-[11px] leading-none text-army-cream/80">{detail}</p> : null}
      </div>
      <img
        src="/army-seal.png"
        alt="United States Army emblem (official Department of the Army emblem)"
        className="h-10 w-10 shrink-0 object-contain"
      />
      <span
        data-draft-mark=""
        role="status"
        aria-label={
          training
            ? "Training draft — not an official Army publication"
            : "Draft — not an official Army publication"
        }
        className="header-draft-mark"
      >
        {mark}
      </span>
    </div>
  );
}
