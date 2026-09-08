export const DRAFT_BANNER_TEXT = "DRAFT / WORKING COPY — NOT AN OFFICIAL ARMY PUBLICATION";

export function DraftBanner() {
  return (
    <div
      className="draft-banner shrink-0 text-center text-[11px] font-bold tracking-[0.12em] text-army-cream py-1.5 border-y border-army-black px-2"
      role="status"
      aria-label={DRAFT_BANNER_TEXT}
    >
      {DRAFT_BANNER_TEXT}
    </div>
  );
}
