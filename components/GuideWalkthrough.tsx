"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { GUIDE_ANCHORS, type GuideAnchor } from "@/lib/guide";

const tableClass = "mt-3 w-full border-collapse text-sm font-ui";
const thClass = "border border-army-black/15 bg-army-olive text-army-cream px-3 py-1.5 text-left font-semibold";
const tdClass = "border border-army-black/15 bg-army-paper px-3 py-1.5 align-top";

function GuideCallout({
  kind,
  title,
  children,
}: {
  kind: "Legal tip" | "Glossary tip" | "Doctrine tip";
  title: string;
  children: ReactNode;
}) {
  return (
    <aside className="mt-4 border-l-4 border-army-gold bg-white px-3 py-2 font-ui text-sm text-army-ink">
      <p className="text-[10px] font-bold tracking-[0.16em] text-army-goldDark">{kind.toUpperCase()}</p>
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
        Everything you write here is a <strong>draft</strong>. It is not Army policy until officially
        published. The gold banner at the top marks it that way. Use <strong>Enter Training</strong> at the
        top of the page for a separate practice copy; <strong>Reset to original</strong> restores that
        training copy only.
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
            <td className={tdClass}>Outline — pick a chapter or section. Hide it to widen the editor.</td>
          </tr>
          <tr>
            <td className={tdClass}>
              <strong>Center</strong>
            </td>
            <td className={tdClass}>Your draft (and the original regulation, read-only, for reference)</td>
          </tr>
          <tr>
            <td className={tdClass}>
              <strong>Right</strong>
            </td>
            <td className={tdClass}>Assist — helpful reminders, glossary, Process map, and authority cites</td>
          </tr>
          <tr>
            <td className={tdClass}>
              <strong>Top</strong>
            </td>
            <td className={tdClass}>Save status, your role, Guide, Word export, G–1 seal, DRAFT banner</td>
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
            Want to hunt by words? Use the outline search. Search looks at the original regulation
            (read-only), then jumps you there.
          </li>
        </ol>
        <p className="mt-3 font-semibold">Tips</p>
        <ul className="list-disc pl-6 space-y-1 mt-1">
          <li>
            A <strong>gold dot</strong> means that section already differs from the original regulation.
          </li>
          <li>
            Editors can reshape the working-copy outline from the left pane: <strong>Add before</strong>,{" "}
            <strong>Add after</strong>, <strong>Add child</strong> under the chapter, <strong>Split</strong>{" "}
            (empty paragraph after this one), <strong>Rename</strong>, <strong>Delete</strong> (you will be
            asked to confirm), or drag <strong>::</strong> to reorder — including into another chapter.
            Right-click a paragraph for the same actions. Display numbers update automatically (1–1, 1–2… or
            A–1). Assist chips and the Process-step highlight stay on that paragraph’s stable id, not the
            display number. Split leaves those reminders on the source until you move text; delete drops them
            with the paragraph. The original regulation stays frozen.
          </li>
          <li>
            A <strong>WG</strong> mark means an Approver said it’s ready for working-group review.
          </li>
          <li>
            Need more room to write? Click <strong>Hide outline</strong> on the left pane or{" "}
            <strong>Hide Assist</strong> on the right pane. The center pane has no hide buttons. Bring a side
            back with <strong>Show outline</strong> / <strong>Show Assist</strong> or the thin strip on that
            side.
          </li>
        </ul>
      </article>

      <hr className="mt-8 border-army-black/15" />

      <article id="working-copy" className="scroll-mt-4 mt-8">
        <h3 className="text-lg font-bold">Step 2 — Edit your draft (not the original regulation)</h3>
        <ol className="list-decimal pl-6 space-y-1 mt-2">
          <li>
            Stay on <strong>your draft</strong> in the center (the lower box). Type a misspelled word if
            you want to confirm the red underline — spellcheck is on for your draft only. Use{" "}
            <strong>Undo</strong> (or Ctrl+Z / ⌘Z) if you need to take a draft edit back. Press{" "}
            <strong>Save</strong> when you want a manual save in the activity list; autosave still runs.
          </li>
          <li>
            Type your changes. Watch the top of the center pane — it should say <strong>Saved</strong> when your
            edits have been stored.
          </li>
          <li>
            Leave the <strong>original regulation (read-only)</strong> box alone. That’s the frozen official
            text for reference only.
          </li>
        </ol>
        <p className="mt-3">You’re always drafting. The gold banner at the top is there on purpose.</p>
        <GuideCallout kind="Doctrine tip" title="Original regulation vs your draft">
          The left outline and search show the original regulation (read-only). Only edit your draft in the
          center.
        </GuideCallout>
      </article>

      <hr className="mt-8 border-army-black/15" />

      <article id="assist" className="scroll-mt-4 mt-8">
        <h3 className="text-lg font-bold">Step 3 — Use Assist reminders on the right</h3>
        <p className="mt-2">
          The right-hand panel is a writing helper for this regulation. It watches the paragraph you have open
          and lists reminders when the wording needs a glossary check, Limited Use Policy (self-referral) or a
          legal / adverse-action hint, or a pointer to another publication. These are gentle nudges — not
          automatic corrections.
        </p>
        <p className="mt-3 font-semibold">How underlined wording appears</p>
        <ol className="list-decimal pl-6 space-y-2 mt-2">
          <li>Open a paragraph in the center.</li>
          <li>
            Open the <strong>Assist</strong> tab on the <strong>right</strong>.
          </li>
          <li>
            If Assist finds matching wording, those terms show up as <strong>underlined reminders</strong>:
            locked glossary terms, Limited Use Policy (self-referral) or legal / adverse-action hints, or overlap
            with another publication. Nothing in your draft changes until you choose an action.
          </li>
        </ol>
        <p className="mt-3 font-semibold">What each action means</p>
        <ul className="list-disc pl-6 space-y-1 mt-1">
          <li>
            <strong>Keep wording</strong> — you reviewed the overlap reminder and are leaving the current
            sentence as written.
          </li>
          <li>
            <strong>Insert See cite</strong> — add a short “See …” pointer to the controlling paragraph or sister
            publication instead of copying that other text into AR 600-85.
          </li>
        </ul>
        <p className="mt-3 font-semibold">When to use the other right-hand tabs</p>
        <ul className="list-disc pl-6 space-y-1 mt-1">
          <li>
            <strong>Glossary reminders</strong> (on Assist) — you used a defined term (ASAP, ADAPT, Limited Use
            Policy, SUDCC, and others). Keep one official meaning.
          </li>
          <li>
            <strong>Authority</strong> — the topic belongs in a sister publication (flags, separations, officer
            actions). Cite that publication; do not paste its procedures here.
          </li>
          <li>
            <strong>Process</strong> — you are writing identification → referral → screening → treatment →
            outcome language and want the flow to stay one system.
          </li>
        </ul>
        <p className="mt-3">Reviewers can read every reminder. Only Editors can record Keep wording or Insert See cite.</p>
        <GuideCallout kind="Legal tip" title="Limited Use Policy vs legal / adverse-action hints">
          Assist shows two kinds of legal help: <strong>Limited Use Policy (self-referral)</strong> — the AR
          600-85 protection that only applies in qualifying self-referral cases — and{" "}
          <strong>Legal / adverse-action hints</strong> for other rights/discipline risks. Don’t read every legal
          chip as Limited Use.
        </GuideCallout>
        <GuideCallout kind="Glossary tip" title="Glossary">
          When Assist underlines a term, prefer the locked ASAP wording (IR versus other test bases, SUDCC
          versus ADAPT, illicit use versus prescription misuse). Reminders never rewrite the paragraph for you.
        </GuideCallout>
        <GuideCallout kind="Doctrine tip" title="Sister publications">
          When Assist flags wording that belongs in another publication, prefer “See AR …” (flags → AR 600-8-2,
          separations → AR 635-200, and so on). Keep short language only if the ASAP context needs it.
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
          <li>Open the notes when your draft touches Limited Use, alcohol incidents, or civilian TDP/EAP.</li>
        </ol>
        <p className="mt-3">Use it when you’re unsure what “right-shaped” policy language should cover.</p>
        <GuideCallout kind="Glossary tip" title="Process">
          Use the Process tab for identification → referral → screen → treat → outcome (and the civilian TDP and
          EAP branch) so those sections stay one system.
        </GuideCallout>
      </article>

      <hr className="mt-8 border-army-black/15" />

      <article id="diff-export" className="scroll-mt-4 mt-8">
        <h3 className="text-lg font-bold">Step 5 — Compare, checkpoint, export</h3>
        <ol className="list-decimal pl-6 space-y-1 mt-2">
          <li>
            Open <strong>Versions</strong> on the right and <strong>save a checkpoint</strong> when you want a
            frozen copy of your draft.
          </li>
          <li>
            Use <strong>Compare (original above, your draft below)</strong> to see the original regulation
            (read-only) stacked above your draft — or next to a checkpoint.
          </li>
          <li>
            <strong>List the changes</strong> shows the real line changes (a simple comparison — not a legal
            review).
          </li>
          <li>
            Open <strong>Summary of Change</strong> at the top of the outline for Revises / Adds / Rescinds
            rows built from the original regulation versus your draft. Cites look like{" "}
            <code>para 1–1</code> or <code>para 1–4a(1)</code>.
          </li>
          <li>
            Click <strong>Word export</strong> or <strong>Export Summary (DRAFT)</strong> up top when you need
            a Word file. Both stay clearly marked <strong>DRAFT</strong> for internal use only.
          </li>
          <li>
            Use Assist <strong>Upload</strong> to drop a <strong>.docx</strong>, <strong>.pdf</strong>, or{" "}
            <strong>.pptx</strong> (25 MB). You get Match / Miss / Unclear suggestion rows against your draft.
            The rows never rewrite your draft or the original regulation.
          </li>
        </ol>
        <GuideCallout kind="Legal tip" title="DRAFT export">
          Every Word export stays marked DRAFT — that is expected when you submit to APD.
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
              <td className={tdClass}>
                Write the draft, reshape the working-copy outline (add, split, delete, move, rename), undo
                draft typing, tasks, activity notes, uploads and document compare, Assist actions, checkpoints
              </td>
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
                Same read-only draft view; you may upload files to compare against your draft; you alone
                can mark <strong>Ready for WG review</strong>
              </td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3">
          <strong>Idle lock:</strong> after about 14 minutes you’ll get a warning; at 15 the session saves and
          locks. An <strong>Editor</strong> or <strong>Approver</strong> can hit <strong>Unlock</strong>.
          Reviewers cannot.
        </p>
      </article>

      <hr className="mt-8 border-army-black/15" />

      <h3 className="text-lg font-bold mt-8">Tiny tour (one breath)</h3>
      <p className="mt-2">
        Left = find it. Center = write it. Right = check it. Top = export it. Hide the sides when you need a
        wider editor. The original regulation never changes. Exports stay DRAFT.
      </p>
    </section>
  );
}
