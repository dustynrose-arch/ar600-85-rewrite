"use client";

type RailProps = {
  side: "left" | "right";
  label: string;
  onExpand: () => void;
};

export function CollapsedRail({ side, label, onExpand }: RailProps) {
  const border = side === "left" ? "border-r" : "border-l";
  return (
    <div className={`shrink-0 w-11 min-h-0 flex flex-col bg-[#efe8d8] ${border} border-army-black/15`}>
      <button
        type="button"
        onClick={onExpand}
        aria-expanded={false}
        aria-label={label}
        title={label}
        className="flex-1 w-full rounded-none px-1 py-3 text-[11px] font-semibold text-army-oliveDark hover:bg-army-gold/25"
      >
        <span
          className="inline-block whitespace-nowrap"
          style={{
            writingMode: "vertical-rl",
            transform: side === "left" ? "rotate(180deg)" : undefined,
          }}
        >
          {label}
        </span>
      </button>
    </div>
  );
}

type ToggleProps = {
  label: string;
  expanded: boolean;
  onClick: () => void;
};

export function PaneToggle({ label, expanded, onClick }: ToggleProps) {
  const text = expanded ? `Hide ${label}` : `Show ${label}`;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-label={text}
      title={text}
      className="btn-secondary !text-[11px] !px-2 !py-1 shrink-0"
    >
      {text}
    </button>
  );
}
