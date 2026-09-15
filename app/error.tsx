"use client";

import { HeaderBrand, HEADER_TITLE } from "@/components/HeaderBrand";

/** Replaces Next.js “Application error” + digest so /access stays reachable. */
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-army-black text-army-cream">
      <header className="header-bar">
        <HeaderBrand title={`${HEADER_TITLE} — error`} training={false} />
      </header>
      <div className="max-w-lg mx-auto px-6 py-10">
        <p className="text-[11px] font-bold tracking-[0.28em] text-army-gold">
          DRAFT TOOL — NOT AN OFFICIAL ARMY SYSTEM
        </p>
        <h1 className="text-2xl font-bold mt-2">Draft tool could not load</h1>
        <p className="mt-3 text-sm text-army-slate leading-relaxed">
          This is a working-copy DRAFT, not an official Army system. Open{" "}
          <a href="/access" className="text-army-gold underline">
            working-group access
          </a>{" "}
          if you have not entered the WG password. If you already did, Redeploy
          and confirm <code className="text-army-cream">BLOB_READ_WRITE_TOKEN</code>{" "}
          on Production.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <a href="/access" className="btn-header">
            Working-group access
          </a>
          <button type="button" onClick={() => reset()} className="btn-header">
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}
