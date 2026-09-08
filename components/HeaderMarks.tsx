export function G1Mark({ className = "h-12 w-12 shrink-0 rounded-full object-cover" }: { className?: string }) {
  return (
    <img
      src="/g1-seal.png"
      alt="Office of the Deputy Chief of Staff, G-1, United States Army seal"
      className={className}
    />
  );
}

/** Empty sized slot — repo has no approved Army emblem; do not invent one. */
export function ArmyMarkSlot() {
  return (
    <div
      className="h-12 w-12 shrink-0 rounded-full border border-army-cream/30 bg-army-oliveDark/50"
      role="img"
      aria-label="United States Army emblem. Official asset pending."
      title="Army emblem slot — drop official file at public/army-emblem.png when supplied"
      data-army-mark-slot="pending"
    />
  );
}
