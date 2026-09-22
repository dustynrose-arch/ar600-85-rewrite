"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { UserGuide } from "@/components/UserGuide";

/**
 * Floating User Guide window over the workbench — not a full-screen modal.
 * Drag the title bar to move; drag the corner to resize. No click-catching
 * backdrop, so the draft underneath stays interactive. Close and Escape dismiss.
 */

const DEFAULT_WIDTH = 420;
const DEFAULT_HEIGHT = 560;
const MIN_WIDTH = 280;
const MIN_HEIGHT = 240;
const VIEW_PAD = 8;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function defaultPlacement(): { x: number; y: number; w: number; h: number } {
  const w = Math.min(DEFAULT_WIDTH, window.innerWidth - VIEW_PAD * 2);
  const h = Math.min(DEFAULT_HEIGHT, window.innerHeight - VIEW_PAD * 2 - 48);
  return {
    x: Math.max(VIEW_PAD, window.innerWidth - w - 24),
    y: 56,
    w,
    h,
  };
}

export function UserGuideOverlay({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{
    mode: "move" | "resize";
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);
  const [box, setBox] = useState({ x: 24, y: 56, w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT });
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    setBox(defaultPlacement());
    setPlaced(true);
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

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (drag.mode === "move") {
        const maxX = Math.max(VIEW_PAD, window.innerWidth - drag.origW - VIEW_PAD);
        const maxY = Math.max(VIEW_PAD, window.innerHeight - drag.origH - VIEW_PAD);
        setBox((prev) => ({
          ...prev,
          x: clamp(drag.origX + dx, VIEW_PAD, maxX),
          y: clamp(drag.origY + dy, VIEW_PAD, maxY),
        }));
        return;
      }
      const maxW = window.innerWidth - drag.origX - VIEW_PAD;
      const maxH = window.innerHeight - drag.origY - VIEW_PAD;
      setBox((prev) => ({
        ...prev,
        w: clamp(drag.origW + dx, MIN_WIDTH, maxW),
        h: clamp(drag.origH + dy, MIN_HEIGHT, maxH),
      }));
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  function startMove(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    event.preventDefault();
    dragRef.current = {
      mode: "move",
      startX: event.clientX,
      startY: event.clientY,
      origX: box.x,
      origY: box.y,
      origW: box.w,
      origH: box.h,
    };
  }

  function startResize(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = {
      mode: "resize",
      startX: event.clientX,
      startY: event.clientY,
      origX: box.x,
      origY: box.y,
      origW: box.w,
      origH: box.h,
    };
  }

  return (
    <div
      id="user-guide-overlay"
      role="dialog"
      aria-modal="false"
      aria-labelledby="user-guide-title"
      data-floating-guide=""
      className="user-guide-window"
      style={{
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        visibility: placed ? "visible" : "hidden",
      }}
    >
      <div className="user-guide-drag" onPointerDown={startMove}>
        <p id="user-guide-title" className="panel-heading">
          User Guide
        </p>
        <button ref={closeRef} type="button" className="btn-header" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="shrink-0 px-4 pt-2 text-[11px] text-army-slate">
        Drag the title bar to move; drag the corner to resize. The draft stays usable underneath.
        Press Escape or Close to dismiss.
      </p>
      <div className="pane-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <UserGuide />
      </div>
      <div
        className="user-guide-resize"
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize User Guide"
        onPointerDown={startResize}
      />
    </div>
  );
}
