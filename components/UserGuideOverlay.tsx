"use client";

import { useEffect, useRef } from "react";
import { UserGuide } from "@/components/UserGuide";

/**
 * Panel over the workbench, not a route change. The panel sits on the right
 * and does not take pointer events from the draft beside it, so that draft
 * can still be panned and edited. Close and Escape dismiss the panel.
 * A full-screen click backdrop is omitted so the draft beside the panel stays live.
 */
export function UserGuideOverlay({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div id="user-guide-overlay" className="pointer-events-none absolute inset-0 z-30 flex justify-end">
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="user-guide-title"
        className="pointer-events-auto flex h-full w-[min(42rem,calc(100%-3rem))] min-w-0 flex-col border-l-2 border-black bg-army-black shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b-2 border-black px-4 py-2">
          <p id="user-guide-title" className="panel-heading">
            User Guide
          </p>
          <button ref={closeRef} type="button" className="btn-header" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="shrink-0 px-4 pt-2 text-[11px] text-army-slate">
          The draft beside this panel stays usable. Press Escape or Close to dismiss.
        </p>
        <div className="pane-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <UserGuide />
        </div>
      </div>
    </div>
  );
}
