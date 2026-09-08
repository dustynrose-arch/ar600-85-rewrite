function HeaderIcon({ path }: { path: string }) {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d={path} clipRule="evenodd" />
    </svg>
  );
}

export const ICON_ROLE =
  "M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z";
export const ICON_EXPORT =
  "M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm4 9a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1H8a1 1 0 110-2h1v-1a1 1 0 011-1z";
export const ICON_SUMMARY =
  "M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1z";
export const ICON_GUIDE =
  "M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z";

export function HeaderGlyph({ d }: { d: string }) {
  return <HeaderIcon path={d} />;
}

export function G1Mark({ className = "h-12 w-12 shrink-0 rounded-full object-cover" }: { className?: string }) {
  return (
    <img
      src="/g1-seal.png"
      alt="Office of the Deputy Chief of Staff, G-1, United States Army seal"
      className={className}
    />
  );
}

/** Empty labeled slot — no Army file in public/; do not invent a seal. */
export function ArmyMarkSlot() {
  return (
    <div
      className="h-12 w-12 shrink-0 rounded-full border border-dashed border-army-cream/40 bg-army-oliveDark/40 flex items-center justify-center"
      role="img"
      aria-label="United States Army emblem placeholder. Official asset pending."
      title="Army emblem slot — official file at public/us-army-logo.png when supplied"
      data-army-mark-slot="pending"
    >
      <span className="text-[8px] font-semibold tracking-[0.12em] uppercase text-army-cream/70">Army</span>
    </div>
  );
}
