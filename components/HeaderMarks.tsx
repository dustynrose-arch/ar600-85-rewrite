function HeaderIcon({ path }: { path: string }) {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d={path} clipRule="evenodd" />
    </svg>
  );
}

export const ICON_ROLE =
  "M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z";
/** Arrow-up-tray — export, never a download (down) chevron. */
export const ICON_EXPORT =
  "M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z";
export const ICON_SUMMARY =
  "M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1z";
export const ICON_GUIDE =
  "M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z";

export function HeaderGlyph({ d }: { d: string }) {
  return <HeaderIcon path={d} />;
}

export function G1Mark({ className = "h-14 w-14 shrink-0 rounded-full object-cover" }: { className?: string }) {
  return (
    <img
      src="/g1-seal.png"
      alt="Office of the Deputy Chief of Staff, G-1, United States Army seal"
      className={className}
    />
  );
}

/** Official stacked U.S. Army lockup — do not crop to a circle. */
export function ArmyMark({ className = "h-14 w-auto max-h-14 shrink-0 object-contain" }: { className?: string }) {
  return (
    <img
      src="/us-army-logo.png"
      alt="United States Army"
      className={className}
      data-army-mark="us-army-logo"
    />
  );
}
