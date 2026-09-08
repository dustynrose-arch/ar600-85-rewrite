"use client";

import { useEffect } from "react";

type Props = {
  message: string;
  onDismiss: () => void;
};

export function Toast({ message, onDismiss }: Props) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 7000);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl bg-army-lock text-army-lockInk px-4 py-3 shadow-lg text-sm border border-army-lockInk/20"
    >
      <p className="font-semibold">Upload rejected</p>
      <p className="mt-1">{message}</p>
    </div>
  );
}
