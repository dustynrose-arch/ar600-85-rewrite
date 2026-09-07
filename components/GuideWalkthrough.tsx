"use client";

import { useCallback, useEffect, useState } from "react";
import { GUIDE_STEPS } from "@/lib/guide";

export function GuideWalkthrough() {
  const [activeId, setActiveId] = useState(GUIDE_STEPS[0].id);

  const openStep = useCallback((id: string, scroll = true) => {
    setActiveId(id);
    if (!scroll) return;
    const el = document.getElementById(`guide-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (window.location.hash !== `#guide-${id}`) {
      window.history.replaceState(null, "", `#guide-${id}`);
    }
  }, []);

  useEffect(() => {
    const raw = window.location.hash.replace(/^#guide-/, "");
    if (GUIDE_STEPS.some((step) => step.id === raw)) {
      setActiveId(raw);
      document.getElementById(`guide-${raw}`)?.scrollIntoView({ block: "start" });
    }
  }, []);

  const index = GUIDE_STEPS.findIndex((step) => step.id === activeId);
  const prev = index > 0 ? GUIDE_STEPS[index - 1] : null;
  const next = index >= 0 && index < GUIDE_STEPS.length - 1 ? GUIDE_STEPS[index + 1] : null;

  return (
    <section className="mt-10" aria-labelledby="guide-walkthrough-heading">
      <h2 id="guide-walkthrough-heading" className="text-xl font-bold">
        Walkthrough
      </h2>
      <p className="mt-1 text-sm text-army-slate">
        Click a step to jump. New users can start here without waiting on a recording.
      </p>
      <ol className="mt-4 flex flex-wrap gap-2">
        {GUIDE_STEPS.map((step, stepIndex) => {
          const selected = step.id === activeId;
          return (
            <li key={step.id}>
              <a
                href={`#guide-${step.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  openStep(step.id);
                }}
                className={`inline-flex items-center gap-2 border px-2.5 py-1.5 text-left text-[12px] font-semibold no-underline ${
                  selected
                    ? "border-army-gold bg-army-gold text-army-black"
                    : "border-army-black/15 bg-white text-army-ink hover:border-army-gold/60"
                }`}
              >
                <span className="tabular-nums">{stepIndex + 1}</span>
                <span className="max-w-[14rem]">{step.title}</span>
              </a>
            </li>
          );
        })}
      </ol>
      <ol className="mt-5 space-y-3">
        {GUIDE_STEPS.map((step, stepIndex) => {
          const selected = step.id === activeId;
          return (
            <li key={step.id}>
              <article
                id={`guide-${step.id}`}
                className={`scroll-mt-4 border bg-army-paper p-4 ${
                  selected ? "border-army-gold shadow-pane" : "border-army-black/10"
                }`}
              >
                <button
                  type="button"
                  onClick={() => openStep(step.id, false)}
                  className="w-full text-left"
                >
                  <p className="text-[10px] font-bold tracking-[0.18em] text-army-goldDark">
                    STEP {stepIndex + 1} OF {GUIDE_STEPS.length}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
                </button>
                <p className="mt-2 text-sm leading-relaxed text-army-ink">{step.body}</p>
              </article>
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        {prev ? (
          <a
            href={`#guide-${prev.id}`}
            onClick={(event) => {
              event.preventDefault();
              openStep(prev.id);
            }}
            className="text-army-goldDark underline"
          >
            ← {prev.title}
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a
            href={`#guide-${next.id}`}
            onClick={(event) => {
              event.preventDefault();
              openStep(next.id);
            }}
            className="text-army-goldDark underline"
          >
            {next.title} →
          </a>
        ) : (
          <span />
        )}
      </div>
    </section>
  );
}
