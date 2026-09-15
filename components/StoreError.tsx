import { HeaderBrand, HEADER_TITLE } from "@/components/HeaderBrand";

/** Shown when persist fails closed (missing Blob, bad token). Not an official system. */
export function StoreError({
  training,
  message,
}: {
  training: boolean;
  message: string;
}) {
  return (
    <main className="min-h-screen bg-army-black text-army-cream">
      <header className="header-bar">
        <HeaderBrand title={`${HEADER_TITLE} — storage`} training={training} />
      </header>
      <div className="max-w-lg mx-auto px-6 py-10">
        <p className="text-[11px] font-bold tracking-[0.28em] text-army-gold">
          DRAFT TOOL — NOT AN OFFICIAL ARMY SYSTEM
        </p>
        <h1 className="text-2xl font-bold mt-2">Draft storage is not ready</h1>
        <p className="mt-3 text-sm text-army-slate leading-relaxed">{message}</p>
        <p className="mt-4 text-sm text-army-slate leading-relaxed">
          On Vercel, Live and Training drafts must live in a private Blob store. Confirm{" "}
          <code className="text-army-cream">BLOB_READ_WRITE_TOKEN</code> is set for Production, then
          Redeploy this deployment (rebuild, not a cached replay).
        </p>
      </div>
    </main>
  );
}
