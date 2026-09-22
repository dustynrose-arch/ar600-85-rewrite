/** Always render both seals with the header DRAFT / TRAINING / DRAFT mark. Never seals alone.
 *  No hide control. Army seal has no decorative box/ring. Do not crop or recolor the emblem files.
 *  Seal sandwich on the left: G-1 seal, left-aligned title + DPRR subtitle, Army seal (unframed).
 *  Only the plain-text DRAFT / TRAINING / DRAFT mark is center-aligned on the full header bar
 *  (true center — not centered inside the seal sandwich). Dual seals + mark stay visible together;
 *  shrink padding/type or wrap actions to the right — never overflow-x scroll the brand off-screen.
 *  Justice: on-screen mark is plain text (no fill). High-contrast on the dark bar. Never a
 *  button, never an authenticated-AR look. Word export stamps stay in lib/export-stamps.ts. */

export const HEADER_TITLE = "AR 600-85 Revision";
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
    <div className="header-brand">
      <img
        src="/g1-seal.png"
        alt="Office of the Deputy Chief of Staff, G-1, United States Army seal"
        className="header-seal header-seal-g1"
      />
      <div className="header-brand-titles">
        <h1 className="header-title">{title}</h1>
        <p className="header-subtitle">{HEADER_SUBTITLE}</p>
        {detail ? <p className="header-detail">{detail}</p> : null}
      </div>
      <img
        src="/army-seal.png"
        alt="United States Army emblem (official Department of the Army emblem)"
        className="header-seal header-seal-army"
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
