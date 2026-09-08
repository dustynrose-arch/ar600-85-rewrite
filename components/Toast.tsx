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
      className="fixed bottom-4 right-4 z-50 max-w-sm bg-army-rust text-white px-4 py-3 shadow-lg text-sm"
    >
      <p className="font-semibold">Upload rejected</p>
      <p className="mt-1">{message}</p>
    </div>
  );
}
