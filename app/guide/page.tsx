import Link from "next/link";
import { UserGuide } from "@/components/UserGuide";

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-army-cream">
      <div className="draft-banner text-center text-[11px] font-bold tracking-[0.28em] text-army-cream py-1.5">
        DRAFT / WORKING COPY
      </div>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link href="/" className="text-sm text-army-goldDark underline">
          ← Return to working copy
        </Link>
        <UserGuide />
      </div>
    </main>
  );
}
