"use client";

import { useCallback, useEffect, useState } from "react";
import { GUIDE_ANCHORS, type GuideAnchor } from "@/lib/guide";

export function GuideWalkthrough() {
  const [activeId, setActiveId] = useState<GuideAnchor["id"]>(GUIDE_ANCHORS[0].id);

  const openAnchor = useCallback((id: GuideAnchor["id"]) => {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (window.location.hash !== `#${id}`) {
      window.history.replaceState(null, "", `#${id}`);
    }
  }, []);

  useEffect(() => {
    const syncFromHash = () => {
      const raw = window.location.hash.replace(/^#/, "");
      if (GUIDE_ANCHORS.some((anchor) => anchor.id === raw)) {
        setActiveId(raw as GuideAnchor["id"]);
      }
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  return (
    <section className="mt-10 font-doc text-army-cream" aria-labelledby="guide-contents">
      <h2 id="guide-contents" className="text-xl font-bold">
        Contents
      </h2>
      <p className="mt-3 text-army-slate">
        Jump to a job in this Guide. The plain gold <strong className="text-army-cream">DRAFT</strong> mark
        stays in the header on every page.
      </p>

      <nav className="mt-4" aria-label="User Guide contents">
        <ol className="flex flex-wrap gap-2 font-ui">
          {GUIDE_ANCHORS.map((anchor) => {
            const selected = anchor.id === activeId;
            return (
              <li key={anchor.id}>
                <a
                  href={`#${anchor.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    openAnchor(anchor.id);
                  }}
                  className={`inline-flex border px-2.5 py-1.5 text-left text-[12px] font-semibold no-underline ${
                    selected
                      ? "border-army-gold bg-army-gold text-army-black"
                      : "border-army-gold/40 bg-army-raised text-army-cream hover:border-army-gold"
                  }`}
                >
                  {anchor.label}
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
    </section>
  );
}
