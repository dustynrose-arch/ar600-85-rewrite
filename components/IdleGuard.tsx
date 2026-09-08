"use client";

import { useEffect, useRef, useState } from "react";
import { IDLE_LOCK_MS, IDLE_WARN_MS, type Role } from "@/lib/types";

type Props = {
  role: Role;
  locked: boolean;
  sectionId: string;
  draftBody: string;
  onLocked: () => void;
};

export function IdleGuard({ role, locked, sectionId, draftBody, onLocked }: Props) {
  const [warn, setWarn] = useState(false);
  const [remaining, setRemaining] = useState(60);
  const last = useRef(Date.now());
  const draftRef = useRef({ sectionId, draftBody, role });
  draftRef.current = { sectionId, draftBody, role };

  useEffect(() => {
    const bump = () => {
      last.current = Date.now();
      setWarn(false);
    };
    const events: (keyof WindowEventMap)[] = ["keydown", "mousedown", "pointerdown", "scroll", "touchstart"];
    events.forEach((name) => window.addEventListener(name, bump, { passive: true }));
    const timer = window.setInterval(async () => {
      if (locked) return;
      const idle = Date.now() - last.current;
      if (idle >= IDLE_LOCK_MS) {
        const current = draftRef.current;
        if (current.role === "editor") {
          await fetch("/api/section", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sectionId: current.sectionId,
              body: current.draftBody,
              role: current.role,
            }),
          });
        }
        await fetch("/api/lock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "lock", reason: "Idle 15 minutes — saved and locked", role: current.role }),
        });
        setWarn(false);
        onLocked();
      } else if (idle >= IDLE_WARN_MS) {
        setWarn(true);
        setRemaining(Math.max(0, Math.ceil((IDLE_LOCK_MS - idle) / 1000)));
      }
    }, 1000);
    return () => {
      events.forEach((name) => window.removeEventListener(name, bump));
      window.clearInterval(timer);
    };
  }, [locked, onLocked]);

  if (!warn || locked) return null;
  return (
    <div className="fixed inset-0 z-50 bg-army-black/55 flex items-center justify-center p-4">
      <div className="bg-army-paper border border-army-gold/50 rounded-xl max-w-md w-full p-5 shadow-lg">
        <p className="text-xs font-semibold tracking-[0.16em] text-army-draftInk">IDLE WARNING</p>
        <h2 className="text-xl font-semibold mt-1">Session idle for 14 minutes</h2>
        <p className="mt-2 text-sm text-army-slate">
          The working copy will save and lock in {remaining} second{remaining === 1 ? "" : "s"} unless you continue
          editing. The original regulation is never modified.
        </p>
        <button
          type="button"
          className="btn-primary mt-4"
          onClick={() => {
            last.current = Date.now();
            setWarn(false);
          }}
        >
          Continue working
        </button>
      </div>
    </div>
  );
}
