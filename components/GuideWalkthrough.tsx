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
    <section className="mt-10 font-doc text-army-ink" aria-labelledby="first-session-walkthrough">
      <h2 id="first-session-walkthrough" className="text-xl font-bold">
        First session walkthrough
      </h2>

      <p className="mt-3">
        Welcome. This tool helps the G-1 rewrite working group draft <strong>AR 600-85</strong> without
        touching the official regulation.
      </p>
      <p className="mt-3">
        Everything you write here is a <strong>DRAFT / WORKING COPY</strong>. It is not Army policy until
        officially published.
      </p>

      <nav className="mt-4" aria-label="First session walkthrough anchors">
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
                      : "border-army-black/15 bg-white text-army-ink hover:border-army-gold/60"
                  }`}
                >
                  {anchor.label}
                </a>
              </li>
            );
          })}
        </ol>
      </nav>

      <h3 className="text-lg font-bold mt-8">The screen in 10 seconds</h3>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li>
          <strong>Left</strong> — Outline (pick a chapter/section)
        </li>
        <li>
          <strong>Center</strong> — Working copy (and Baseline / Diff)
        </li>
        <li>
          <strong>Right</strong> — Assist chips, glossary, Process map
        </li>
        <li>
          <strong>Top</strong> — Save status, role, Guide, Word export
        </li>
      </ul>

      <article id="outline" className="scroll-mt-4 mt-8 border border-army-black/10 bg-army-paper p-4">
        <h3 className="text-lg font-bold">Step 1 — Open a section</h3>
        <ol className="list-decimal pl-6 space-y-1 mt-2">
          <li>Left pane: click a chapter, appendix, or Glossary entry.</li>
          <li>It opens in the center.</li>
          <li>
            Search: outline box or <strong>Ctrl+K</strong> / <strong>⌘K</strong> (searches baseline, then
            jumps).
          </li>
        </ol>
        <p className="mt-2">
          Tips: gold dot = differs from baseline; <strong>WG</strong> = Approver marked ready for WG review.
        </p>
      </article>

      <article id="working-copy" className="scroll-mt-4 mt-4 border border-army-black/10 bg-army-paper p-4">
        <h3 className="text-lg font-bold">Step 2 — Edit your draft (not the baseline)</h3>
        <ol className="list-decimal pl-6 space-y-1 mt-2">
          <li>
            Stay on <strong>Working copy</strong>.
          </li>
          <li>
            Type; wait for <strong>Saved</strong> in the top bar.
          </li>
          <li>
            Don’t edit <strong>Baseline</strong> — frozen official text only.
          </li>
        </ol>
        <p className="mt-2">Gold banner = always a draft.</p>
      </article>

      <article id="assist" className="scroll-mt-4 mt-4 border border-army-black/10 bg-army-paper p-4">
        <h3 className="text-lg font-bold">Step 3 — Assist chips</h3>
        <p className="mt-2">Underlines are nudges, not auto-fixes.</p>
        <ol className="list-decimal pl-6 space-y-1 mt-2">
          <li>
            Right pane → <strong>Assist</strong>.
          </li>
          <li>Read the chip (glossary / Limited Use / sister-pub overlap / spelling).</li>
          <li>
            Editor choices: <strong>Use locked term</strong>, <strong>Keep wording</strong>, or{" "}
            <strong>Insert See cite</strong>.
          </li>
          <li>
            Need cites or flow? <strong>Authority</strong> / <strong>Glossary</strong> /{" "}
            <strong>Process</strong>.
          </li>
        </ol>
        <p className="mt-2">Nothing rewrites unless the Editor chooses.</p>
      </article>

      <article id="process" className="scroll-mt-4 mt-4 border border-army-black/10 bg-army-paper p-4">
        <h3 className="text-lg font-bold">Step 4 — Process map</h3>
        <p className="mt-2">
          Right → <strong>Process</strong>. Click ID → referral → SUDCC → treatment → return/separation. Use
          callouts for Limited Use, alcohol, civilian TDP/EAP.
        </p>
      </article>

      <article id="diff-export" className="scroll-mt-4 mt-4 border border-army-black/10 bg-army-paper p-4">
        <h3 className="text-lg font-bold">Step 5 — Diff, snapshot, export</h3>
        <ol className="list-decimal pl-6 space-y-1 mt-2">
          <li>
            <strong>Save snapshot</strong> under the editor for a checkpoint.
          </li>
          <li>
            <strong>Diff</strong> vs baseline or a snapshot.
          </li>
          <li>
            <strong>Summarize</strong> = real line changes (not AI / not legal review).
          </li>
          <li>
            <strong>Word export</strong> = DRAFT-stamped .docx, internal use only.
          </li>
        </ol>
      </article>

      <article id="roles" className="scroll-mt-4 mt-4 border border-army-black/10 bg-army-paper p-4">
        <h3 className="text-lg font-bold">Step 6 — Roles</h3>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>
            <strong>Editor</strong> — writes draft, tasks, timeline, uploads, Assist, snapshots
          </li>
          <li>
            <strong>Reviewer</strong> — browse only
          </li>
          <li>
            <strong>Approver</strong> — browse only + <strong>Ready for WG review</strong>
          </li>
        </ul>
        <p className="mt-2">
          Idle: warn ~14m, lock ~15m; only Editor <strong>Resume session</strong>.
        </p>
      </article>

      <h3 className="text-lg font-bold mt-8">Tiny tour</h3>
      <p className="mt-2">
        Left = find it. Center = write it. Right = check it. Top = export it. Baseline never changes. Exports
        stay DRAFT.
      </p>
    </section>
  );
}
