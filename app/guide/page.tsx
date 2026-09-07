import Link from "next/link";
import { DraftBanner } from "@/components/DraftBanner";
import { UserGuide } from "@/components/UserGuide";

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-army-cream">
      <DraftBanner />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link href="/" className="text-sm text-army-goldDark underline">
          ← Return to working copy
        </Link>
        <UserGuide />
      </div>
    </main>
  );
}
