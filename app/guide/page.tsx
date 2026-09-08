import Link from "next/link";
import { UserGuide } from "@/components/UserGuide";

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-army-cream">
      <header className="shrink-0 bg-army-header text-army-wash px-4 py-2.5 flex items-center gap-4">
        <img
          src="/g1-seal.png"
          alt="Office of the Deputy Chief of Staff, G-1, United States Army seal"
          className="h-12 w-12 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold leading-tight">AR 600-85 Rewrite — User Guide</h1>
          <p className="text-xs text-army-gold">Internal G-1 rewrite working group use only</p>
          <p className="text-[11px] text-army-cream/80">How to use your draft</p>
        </div>
        <Link href="/" className="btn-ghost btn-sm">
          Return to your draft
        </Link>
      </header>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <UserGuide />
      </div>
    </main>
  );
}
