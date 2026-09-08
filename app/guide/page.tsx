import Link from "next/link";
import { ArmyMarkSlot, G1Mark, HeaderGlyph, ICON_GUIDE } from "@/components/HeaderMarks";
import { UserGuide } from "@/components/UserGuide";

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-army-cream">
      <header className="shrink-0 bg-army-header text-army-wash px-4 py-2.5 flex items-center gap-4">
        <G1Mark />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold leading-tight">AR 600-85 Revision</h1>
          <p className="text-xs text-army-gold">Directorate of Prevention, Resilience and Readiness</p>
        </div>
        <Link href="/" className="btn-header">
          <HeaderGlyph d={ICON_GUIDE} />
          Return to your draft
        </Link>
        <ArmyMarkSlot />
      </header>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <UserGuide />
      </div>
    </main>
  );
}
