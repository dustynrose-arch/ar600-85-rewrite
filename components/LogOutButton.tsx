"use client";

import { useState } from "react";

/** Clears the WG access cookie, then returns to the password page. */
export function LogOutButton() {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const logout = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch("/api/access", { method: "DELETE" });
      if (!res.ok) {
        setBusy(false);
        setFailed(true);
        return;
      }
      window.location.assign("/access");
    } catch {
      setBusy(false);
      setFailed(true);
    }
  };

  return (
    <>
      <button
        type="button"
        className="btn-header"
        onClick={() => void logout()}
        disabled={busy}
        aria-describedby={failed ? "wg-logout-error" : undefined}
      >
        Log out
      </button>
      {failed ? (
        <span id="wg-logout-error" role="alert" className="text-[10px] font-semibold text-army-rust">
          Try again
        </span>
      ) : null}
    </>
  );
}
