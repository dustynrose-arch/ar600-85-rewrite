"use client";

import { useEffect, useState } from "react";
import { GUIDE_VIDEO_FILE, GUIDE_VIDEO_SRC } from "@/lib/guide";

export function GuideVideo({ src = GUIDE_VIDEO_SRC }: { src?: string }) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(src, { method: "HEAD" })
      .then((res) => {
        if (!cancelled && res.ok) setAvailable(true);
      })
      .catch(() => {
        /* stay on placeholder */
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <section className="mt-8" aria-labelledby="guide-video-heading">
      <h2 id="guide-video-heading" className="text-xl font-bold">
        Tutorial video
      </h2>
      {available ? (
        <video className="mt-3 w-full bg-army-black" controls preload="metadata" src={src}>
          Your browser does not support embedded video. Use the text walkthrough below.
        </video>
      ) : (
        <div
          className="mt-3 flex min-h-[220px] flex-col items-center justify-center border border-army-black/15 bg-army-black px-6 py-10 text-center text-army-cream"
          role="status"
        >
          <p className="text-[10px] font-bold tracking-[0.22em] text-army-gold">VIDEO SLOT</p>
          <p className="mt-2 text-lg font-semibold">Tutorial video coming soon</p>
          <p className="mt-1 max-w-md text-sm text-army-cream/75">
            Use the clickable walkthrough below until a recording is posted.
          </p>
          <details className="mt-4 max-w-lg text-left text-[11px] text-army-cream/60">
            <summary className="cursor-pointer text-army-gold/90">Maintainer note</summary>
            <p className="mt-2 leading-relaxed">
              Drop an MP4 at <code className="text-army-gold">{GUIDE_VIDEO_FILE}</code> (served as{" "}
              <code className="text-army-gold">{src}</code>). Refresh the User Guide; the player
              appears when that file is present. No rebuild required in <code>next dev</code>.
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
