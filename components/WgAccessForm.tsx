import { safeAccessNext } from "@/lib/wg-access";

/**
 * Native password form. The input is uncontrolled so it still accepts typing
 * when client JS is blocked, CSP strips hydration, or React never attaches.
 */
export function WgAccessForm({
  error = null,
  from = "/",
}: {
  error?: string | null;
  from?: string;
}) {
  const next = safeAccessNext(from);
  const returnTo = next === "/" ? "" : next;
  return (
    <form className="mt-6 space-y-3" method="post" action="/api/access">
      {returnTo ? <input type="hidden" name="from" value={returnTo} /> : null}
      <label className="block text-xs font-semibold tracking-wide text-army-gold">
        Working-group password
        {/* Lowercase attribute: React 19 SSR does not rename this to autocomplete. */}
        <input
          type="password"
          name="secret"
          required
          className="mt-1 w-full rounded-lg border border-army-gold bg-army-ink px-3 py-2 text-sm text-army-cream"
          {...{ autocomplete: "current-password" }}
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-army-rust">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn-header">
        Continue to the draft
      </button>
    </form>
  );
}
