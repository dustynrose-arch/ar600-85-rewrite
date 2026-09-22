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
    <form className="wg-access-form mt-6 space-y-3" method="POST" action="/api/access">
      {returnTo ? <input type="hidden" name="from" value={returnTo} /> : null}
      <label className="block text-xs font-semibold tracking-wide text-army-gold" htmlFor="wg-access-secret">
        Working-group password
      </label>
      {/* Lowercase attribute: React 19 SSR does not rename this to autocomplete. */}
      <input
        id="wg-access-secret"
        type="password"
        name="secret"
        required
        className="wg-access-secret mt-1 w-full rounded-lg border border-army-gold bg-army-ink px-3 py-2 text-sm text-army-cream"
        {...{ autocomplete: "current-password" }}
      />
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
