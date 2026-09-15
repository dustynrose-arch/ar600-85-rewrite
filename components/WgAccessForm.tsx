"use client";

import { useState } from "react";

export function WgAccessForm() {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Access denied.");
      const next = new URLSearchParams(window.location.search).get("from") || "/";
      window.location.assign(next.startsWith("/") ? next : "/");
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Access denied.");
    }
  };

  return (
    <form className="mt-6 space-y-3" onSubmit={(event) => void submit(event)}>
      <label className="block text-xs font-semibold tracking-wide text-army-gold">
        Working-group password
        <input
          type="password"
          autoComplete="current-password"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          className="mt-1 w-full rounded-lg border border-army-gold bg-army-ink px-3 py-2 text-sm text-army-cream"
        />
      </label>
      {error ? <p className="text-sm text-army-rust">{error}</p> : null}
      <button type="submit" disabled={busy} className="btn-header disabled:opacity-60">
        Continue to the draft
      </button>
    </form>
  );
}
