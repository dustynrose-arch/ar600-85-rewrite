export function DraftBanner() {
  return (
    <div
      className="draft-banner shrink-0 px-4 py-1 flex items-center gap-2"
      role="status"
      aria-label="Draft working copy"
    >
      <span className="font-semibold uppercase tracking-[0.16em] text-[11px]">DRAFT / WORKING COPY</span>
    </div>
  );
}
