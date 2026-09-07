"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { GUIDE_ANCHORS, type GuideAnchor } from "@/lib/guide";

const tableClass = "mt-3 w-full border-collapse text-sm font-ui";
const thClass = "border border-army-black/15 bg-army-olive text-army-cream px-3 py-1.5 text-left font-semibold";
const tdClass = "border border-army-black/15 bg-army-paper px-3 py-1.5 align-top";

function GuideCallout({
  who,
  title,
  children,
}: {
  who: "Justice" | "Cheech";
  title: string;
  children: ReactNode;
}) {
  return (
    <aside className="mt-4 border-l-4 border-army-gold bg-white px-3 py-2 font-ui text-sm text-army-ink">
      <p className="text-[10px] font-bold tracking-[0.16em] text-army-goldDark">
        {who.toUpperCase()} · WP6
      </p>
      <p className="mt-0.5 font-semibold">{title}</p>
      <div className="mt-1 text-army-slate leading-relaxed">{children}</div>
    </aside>
  );
}

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

      <hr className="mt-8 border-army-black/15" />

      <h3 className="text-lg font-bold mt-8">The screen in 10 seconds</h3>
      <table className={tableClass}>
        <thead>
          <tr>
            <th className={thClass}>Where</th>
            <th className={thClass}>What it is</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={tdClass}>
              <strong>Left</strong>
            </td>
            <td className={tdClass}>Outline — pick a chapter or section</td>
          </tr>
          <tr>
            <td className={tdClass}>
              <strong>Center</strong>
            </td>
            <td className={tdClass}>Your working copy (and Baseline / Diff)</td>
          </tr>
          <tr>
            <td className={tdClass}>
              <strong>Right</strong>
            </td>
            <td className={tdClass}>Helpful refs — Assist chips, glossary, Process map</td>
          </tr>
          <tr>
            <td className={tdClass}>
              <strong>Top</strong>
            </td>
            <td className={tdClass}>Save status, your role, Guide, Word export</td>
          </tr>
        </tbody>
      </table>

      <hr className="mt-8 border-army-black/15" />

      <article id="outline" className="scroll-mt-4 mt-8">
        <h3 className="text-lg font-bold">Step 1 — Open a section</h3>
        <ol className="list-decimal pl-6 space-y-1 mt-2">
          <li>
            On the <strong>left</strong>, click any chapter, appendix, or Glossary entry.
          </li>
          <li>
            It opens in the <strong>center</strong>.
          </li>
          <li>
            Want to hunt by words? Use the outline search, or press <strong>Ctrl+K</strong> (Mac:{" "}
            <strong>⌘K</strong>). Search looks at the official baseline text, then jumps you there.
          </li>
        </ol>
        <p className="mt-3 font-semibold">Tips</p>
        <ul className="list-disc pl-6 space-y-1 mt-1">
          <li>
            A <strong>gold dot</strong> means that section already differs from the official baseline.
          </li>
          <li>
            A <strong>WG</strong> mark means an Approver said it’s ready for working-group review.
          </li>
        </ul>
      </article>

      <hr className="mt-8 border-army-black/15" />

      <article id="working-copy" className="scroll-mt-4 mt-8">
        <h3 className="text-lg font-bold">Step 2 — Edit your draft (not the baseline)</h3>
        <ol className="list-decimal pl-6 space-y-1 mt-2">
          <li>
            Stay on the <strong>Working copy</strong> tab in the center.
          </li>
          <li>
            Type your changes. Watch the top bar — it should say <strong>Saved</strong> when the server has
            them.
          </li>
          <li>
            Leave the <strong>Baseline</strong> tab alone. That’s the frozen official text for reference only.
          </li>
        </ol>
        <p className="mt-3">You’re always drafting. The gold banner at the top is there on purpose.</p>
      </article>

      <hr className="mt-8 border-army-black/15" />

      <article id="assist" className="scroll-mt-4 mt-8">
        <h3 className="text-lg font-bold">Step 3 — When yellow/red underlines show up (Assist)</h3>
        <p className="mt-2">Those marks are gentle nudges — not auto-corrections.</p>
        <ol className="list-decimal pl-6 space-y-2 mt-2">
          <li>
            Open the <strong>Assist</strong> tab on the <strong>right</strong>.
          </li>
          <li>Read the chip. It might be about glossary wording, Limited Use risk, overlap with another pub, or a spelling.</li>
          <li>
            If you’re an <strong>Editor</strong>, pick what fits:
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                <strong>Use locked term</strong> — swap to the preferred ASAP wording
              </li>
              <li>
                <strong>Keep wording</strong> — dismiss this chip
              </li>
              <li>
                <strong>Insert See cite</strong> — drop in a short “See …” pointer when offered
              </li>
            </ul>
          </li>
          <li>
            Need cites or the flow map instead? Switch to <strong>Authority</strong>, <strong>Glossary</strong>,
            or <strong>Process</strong>.
          </li>
        </ol>
        <p className="mt-3">Nothing rewrites your text unless you choose it.</p>
        <GuideCallout who="Justice" title="Limited Use">
          When Assist chips fire on testing/referral/discipline (especially self-ID), don’t treat that as open
          season for punishment. Follow Limited Use / SJA and cite AR 600-8-2 / 635-200 instead of rewriting
          those pubs into 600-85.
        </GuideCallout>
        <GuideCallout who="Cheech" title="Glossary">
          When Assist underlines a term, prefer locked ASAP wording (IR vs other test bases, SUDCC vs ADAPT,
          illicit use vs prescription misuse). Chips never auto-rewrite.
        </GuideCallout>
      </article>

      <hr className="mt-8 border-army-black/15" />

      <article id="process" className="scroll-mt-4 mt-8">
        <h3 className="text-lg font-bold">Step 4 — Peek at the Process map</h3>
        <ol className="list-decimal pl-6 space-y-1 mt-2">
          <li>
            Right side → <strong>Process</strong>.
          </li>
          <li>
            Click through the path: how a Soldier is identified → referral → SUDCC → treatment → return to duty
            or separation.
          </li>
          <li>Open the callouts when your draft touches Limited Use, alcohol incidents, or civilian TDP/EAP.</li>
        </ol>
        <p className="mt-3">Use it when you’re unsure what “right-shaped” policy language should cover.</p>
        <GuideCallout who="Cheech" title="Process">
          Use the Process tab for ID → Referral → Screen → Treat → Outcome (and the civilian TDP+EAP branch) so
          those sections stay one system.
        </GuideCallout>
      </article>

      <hr className="mt-8 border-army-black/15" />

      <article id="diff-export" className="scroll-mt-4 mt-8">
        <h3 className="text-lg font-bold">Step 5 — Compare, checkpoint, export</h3>
        <ol className="list-decimal pl-6 space-y-1 mt-2">
          <li>
            <strong>Save snapshot</strong> (under the editor) when you want a frozen checkpoint.
          </li>
          <li>
            Open <strong>Diff</strong> to see your draft next to the official baseline — or next to a snapshot.
          </li>
          <li>
            <strong>Summarize</strong> lists the real line changes (simple local diff — not AI, not a legal
            review).
          </li>
          <li>
            Click <strong>Word export</strong> up top when you need a <code>.docx</code>. It stays clearly
            marked <strong>DRAFT</strong> for internal use only.
          </li>
        </ol>
        <GuideCallout who="Justice" title="DRAFT export">
          Every Word export keeps DRAFT / WORKING COPY — normal for APD submit.
        </GuideCallout>
      </article>

      <hr className="mt-8 border-army-black/15" />

      <article id="roles" className="scroll-mt-4 mt-8">
        <h3 className="text-lg font-bold">Step 6 — Know your role</h3>
        <p className="mt-2">Change role with the control in the header.</p>
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Role</th>
              <th className={thClass}>You can…</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={tdClass}>
                <strong>Editor</strong>
              </td>
              <td className={tdClass}>Write the draft, tasks, timeline, uploads, Assist actions, snapshots</td>
            </tr>
            <tr>
              <td className={tdClass}>
                <strong>Reviewer</strong>
              </td>
              <td className={tdClass}>Read and browse everything; you can’t change the draft</td>
            </tr>
            <tr>
              <td className={tdClass}>
                <strong>Approver</strong>
              </td>
              <td className={tdClass}>
                Same read-only draft view; you alone can mark <strong>Ready for WG review</strong>
              </td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3">
          <strong>Idle lock:</strong> after about 14 minutes you’ll get a warning; at 15 the session saves and
          locks. Only an <strong>Editor</strong> can hit <strong>Resume session</strong>.
        </p>
      </article>

      <hr className="mt-8 border-army-black/15" />

      <h3 className="text-lg font-bold mt-8">Tiny tour (one breath)</h3>
      <p className="mt-2">
        Left = find it. Center = write it. Right = check it. Top = export it. Baseline never changes. Exports
        stay DRAFT.
      </p>
    </section>
  );
}
