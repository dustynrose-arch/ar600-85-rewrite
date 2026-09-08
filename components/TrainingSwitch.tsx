"use client";

import { useEffect, useState } from "react";
import { canResetTraining } from "@/lib/roles";
import type { Role, WorkspaceMode } from "@/lib/types";

type Props = {
  mode: WorkspaceMode;
  role: Role;
  beforeSwitch?: () => Promise<void>;
  onResetApplied?: () => void;
};

export function TrainingSwitch({ mode, role, beforeSwitch, onResetApplied }: Props) {
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canReset = mode === "training" && canResetTraining(role);

  useEffect(() => {
    if (!confirmReset) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) setConfirmReset(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmReset, busy]);

  const switchMode = async (next: WorkspaceMode) => {
    if (busy || next === mode) return;
    setBusy(true);
    setError(null);
    try {
      await beforeSwitch?.();
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mode", mode: next }),
      });
      if (!res.ok) throw new Error("Could not switch Training mode.");
      window.location.reload();
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Could not switch Training mode.");
    }
  };

  const resetTraining = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-training", role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reset failed.");
      onResetApplied?.();
      window.location.reload();
    } catch (err) {
      setBusy(false);
      setConfirmReset(false);
      setError(err instanceof Error ? err.message : "Reset failed.");
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-2 border-army-gold bg-army-ink px-2 py-1">
        {mode === "training" ? (
          <>
            <span className="text-[11px] font-bold tracking-[0.28em] text-army-gold">TRAINING</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => void switchMode("live")}
              className="rounded-lg bg-army-gold text-army-black px-3 py-1.5 text-xs font-bold border border-army-cream disabled:opacity-60"
            >
              Leave Training
            </button>
            {canReset ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setError(null);
                  setConfirmReset(true);
                }}
                className="rounded-lg border border-army-gold text-army-cream px-2.5 py-1 text-xs font-semibold"
              >
                Reset to original
              </button>
            ) : (
              <span className="text-[10px] text-army-cream/70 max-w-[9rem] leading-tight">
                Switch to Editor or Approver to reset
              </span>
            )}
          </>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void switchMode("training")}
            className="rounded-lg bg-army-gold text-army-black px-3 py-1.5 text-xs font-bold"
          >
            Enter Training
          </button>
        )}
      </div>
      {error ? <p className="text-[10px] text-army-gold max-w-[12rem]">{error}</p> : null}
      {confirmReset ? (
        <div
          className="fixed inset-0 z-[80] bg-army-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-training-title"
          onClick={() => {
            if (!busy) setConfirmReset(false);
          }}
        >
          <div
            className="bg-army-paper border-2 border-army-rust max-w-md w-full max-h-[90vh] overflow-y-auto p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs font-bold tracking-[0.2em] text-army-rust">CONFIRM RESET</p>
            <h2 id="reset-training-title" className="text-xl font-bold mt-1">
              Reset the training copy?
            </h2>
            <p className="mt-2 text-sm text-army-slate">
              This clears practice edits, uploads, and the training activity list, then restores the training copy
              from the original regulation. Live workspace is not touched.
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                className="rounded-lg px-3 py-1.5 text-sm font-bold border-2 border-army-black bg-army-ink text-army-cream disabled:opacity-60"
                onClick={() => setConfirmReset(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                className="rounded-lg px-3 py-1.5 text-sm font-bold border-2 border-army-rust bg-army-rust text-white disabled:opacity-60"
                onClick={() => void resetTraining()}
              >
                Reset to original
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
