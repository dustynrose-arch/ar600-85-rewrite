"use client";

import { useEffect, useState } from "react";
import { GUIDE_CLIPS, GUIDE_VIDEO_SRC, type GuideClip } from "@/lib/guide";

async function videoExists(src: string): Promise<boolean> {
  try {
    const head = await fetch(src, { method: "HEAD" });
    if (head.ok) return true;
    if (head.status !== 405) return false;
    const ranged = await fetch(src, { method: "GET", headers: { Range: "bytes=0-0" } });
    return ranged.ok;
  } catch {
    return false;
  }
}

export function GuideVideo({ src = GUIDE_VIDEO_SRC }: { src?: string }) {
  const [available, setAvailable] = useState<GuideClip[]>([]);
  const [legacy, setLegacy] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function probe() {
      const found: GuideClip[] = [];
      for (const clip of GUIDE_CLIPS) {
        if (await videoExists(clip.src)) found.push(clip);
      }
      const hasLegacy = found.length === 0 ? await videoExists(src) : false;
      if (cancelled) return;
      setAvailable(found);
      setLegacy(hasLegacy);
      setActive(found[0]?.id ?? (hasLegacy ? "legacy" : null));
      setReady(true);
    }

    void probe();
    return () => {
      cancelled = true;
    };
  }, [src]);

  const current = available.find((clip) => clip.id === active);
  const showPlayer = Boolean(current || (legacy && active === "legacy"));
  const playerSrc = current?.src ?? (legacy ? src : "");

  return (
    <section className="mt-8" aria-labelledby="guide-video-heading">
      <h2 id="guide-video-heading" className="text-xl font-bold">
        Tutorial videos
      </h2>
      {!ready ? (
        <p className="mt-3 text-sm text-army-slate">Looking for videos…</p>
      ) : showPlayer ? (
        <div className="mt-3">
          {available.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2" role="tablist" aria-label="Tutorial videos">
              {available.map((clip) => {
                const selected = clip.id === active;
                return (
                  <button
                    key={clip.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActive(clip.id)}
                    className={`border px-2.5 py-1.5 text-[12px] font-semibold ${
                      selected
                        ? "border-army-gold bg-army-gold text-army-black"
                        : "border-army-black/15 bg-white text-army-ink"
                    }`}
                  >
                    {clip.label}
                  </button>
                );
              })}
            </div>
          ) : null}
          <video key={playerSrc} className="w-full bg-army-black" controls preload="metadata" src={playerSrc}>
            Your browser does not support embedded video. Use the text walkthrough below.
          </video>
        </div>
      ) : (
        <div
          className="mt-3 flex min-h-[220px] flex-col items-center justify-center border border-army-black/15 bg-army-black px-6 py-10 text-center text-army-cream"
          role="status"
        >
          <p className="text-[10px] font-bold tracking-[0.22em] text-army-gold">TUTORIAL</p>
          <p className="mt-2 text-lg font-semibold">Short videos coming soon</p>
          <p className="mt-1 max-w-md text-sm text-army-cream/75">
            Use the clickable walkthrough below until recordings are posted. When posted, they will appear
            here as Layout, Find & edit, Help while writing, and Compare & export.
          </p>
        </div>
      )}
    </section>
  );
}
