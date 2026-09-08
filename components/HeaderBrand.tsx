/** Always render with DraftBanner (and TrainingBanner in Training). Never seals alone. */

export const HEADER_TITLE = "AR 600-85 Rewrite";
export const HEADER_SUBTITLE = "Directorate of Prevention, Resilience and Readiness";

export function HeaderBrand({
  title = HEADER_TITLE,
  detail,
}: {
  title?: string;
  detail?: string;
}) {
  return (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <img
        src="/g1-seal.png"
        alt="Office of the Deputy Chief of Staff, G-1, United States Army seal"
        className="h-12 w-12 shrink-0 rounded-full object-contain"
      />
      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-semibold leading-tight">{title}</h1>
        <p className="text-xs text-army-gold">{HEADER_SUBTITLE}</p>
        {detail ? <p className="text-[11px] text-army-cream/80">{detail}</p> : null}
      </div>
      <img
        src="/army-seal.png"
        alt="United States Army emblem (official Department of the Army emblem)"
        className="h-12 w-12 shrink-0 object-contain"
      />
    </div>
  );
}
