import { GuideVideo } from "@/components/GuideVideo";
import { GuideWalkthrough } from "@/components/GuideWalkthrough";

export function UserGuide() {
  return (
    <article className="prose prose-slate max-w-none font-doc text-army-ink">
      <p className="mt-4 text-xs font-ui font-bold tracking-[0.2em] text-army-goldDark">USER GUIDE</p>
      <h1 className="text-3xl font-bold mt-1">AR 600–85 Rewrite — User Guide</h1>
      <p className="text-army-slate">
        Internal G–1 rewrite working group use only. This application never changes the original
        regulation (read-only).
      </p>

      <GuideVideo />
      <GuideWalkthrough />

      <h2 className="text-xl font-bold mt-10">Workspace</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Three panes: outline on the left, your draft in the center, and Assist on the right.</li>
        <li>
          Use <strong>Hide outline</strong> on the left pane and <strong>Hide Assist</strong> on the right pane
          to widen the center editor. Use <strong>Show outline</strong> or <strong>Show Assist</strong> — or
          the thin side strips — to bring a pane back. The center editor does not have hide buttons. The
          workspace remembers those choices until you close the browser tab.
        </li>
        <li>
          G–1 seal in the header, with a thin gold <strong>DRAFT / WORKING COPY</strong> line. Word exports
          stay stamped DRAFT.
        </li>
        <li>
          Original regulation (read-only): AR 600–85 (4 Oct 2024, admin revs 27 Feb 2025 / 19 Feb 2026).
        </li>
        <li>
          Your edits save automatically. Editors can also press <strong>Save</strong> next to your draft
          (that writes a “Manual save” line in the activity list). Editors can Undo in your draft (button or
          Ctrl+Z / ⌘Z). The original regulation pane does not undo and is not spellchecked.
        </li>
        <li>
          Search looks only at the original regulation (read-only). Click a result to highlight matches in
          the open section; × clears the query, results, and highlights.
        </li>
        <li>
          Editors reshape the <strong>working-copy</strong> outline from the left pane: Add before / after,
          Split, Delete (confirm), Rename, and drag to reorder. Display numbers renumber inside the parent
          (chapter→para). Nested subparagraphs (4–2a, 4–2a(1)) stay in the paragraph text box. Assist chips
          and the Process-step highlight stay on each paragraph’s stable id — never
          the display number, and never the original regulation. Reviewers and Approvers cannot change
          structure.
        </li>
        <li>Idle warning at 14 minutes; at 15 minutes the current section is saved and the workspace locks.</li>
      </ul>

      <h2 className="text-xl font-bold mt-8">Roles and gates</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Editor</strong> — edit your draft, reshape the working-copy outline (add, split, delete,
          move, rename), Save or Undo draft typing, create and complete tasks, save checkpoints, record overlap
          decisions, and upload files to compare against your draft. May unlock after an idle lock.
        </li>
        <li>
          <strong>Reviewer</strong> — read-only. May inspect comparisons, the activity list, and authority
          reminders. Cannot unlock after an idle lock.
        </li>
        <li>
          <strong>Approver</strong> — read-only text. May upload files to compare against your draft, and
          mark sections or the full book ready for working-group review. May unlock after an idle lock.
        </li>
      </ul>

      <h2 className="text-xl font-bold mt-8">Assist — the right-hand writing helper</h2>
      <p>
        Assist watches the paragraph you have open in the center. It is a reminder list for G–1 editors, not an
        automatic rewrite tool. When the current wording touches a locked glossary term, Limited Use Policy
        (self-referral), another legal / adverse-action hint, or a topic another publication already covers, Assist
        lists those reminders on the right.
      </p>
      <h3 className="text-lg font-semibold mt-4">How underlined wording appears</h3>
      <p>
        Open a paragraph. If Assist finds matching wording, those terms and topics show up on the Assist tab as
        underlined reminders (locked glossary terms, Limited Use Policy or legal / adverse-action hints, or overlap
        with another publication). They are suggestions only. Your draft does not change until you choose an action.
      </p>
      <h3 className="text-lg font-semibold mt-4">What each action means</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Keep wording</strong> — you reviewed the overlap reminder and are leaving the current sentence
          as written.
        </li>
        <li>
          <strong>Insert See cite</strong> — add a short “See …” pointer to the controlling paragraph or sister
          publication instead of copying that other text into AR 600–85.
        </li>
      </ul>
      <p>
        Glossary reminders and legal chips are informational: they tell you which locked terms or legal topics
        are in this paragraph. Only Editors can record Keep wording or Insert See cite.
      </p>
      <h3 className="text-lg font-semibold mt-4">When to use Glossary, Process, and authority references</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Glossary reminders (Assist tab)</strong> — when you use a defined term such as ASAP, ADAPT,
          Limited Use Policy, SUDCC, UDL, MRO, or DAMIS. Keep one official meaning and point readers to the
          glossary or the controlling paragraph. Do not invent a second definition in a commander’s guide.
        </li>
        <li>
          <strong>Authority tab</strong> — when the topic belongs in a sister publication (flags, separations,
          officer actions). Cite that publication; do not paste its procedures into AR 600–85.
        </li>
        <li>
          <strong>Process tab</strong> — when you are writing identification, referral, screening, treatment, or
          return-to-duty language. Use the map so those sections stay one system, including the civilian TDP and
          EAP branch.
        </li>
      </ul>

      <h2 className="text-xl font-bold mt-8">Legal help — two kinds</h2>
      <p>
        Assist shows two kinds of legal help: <strong>Limited Use Policy (self-referral)</strong> — the AR 600-85
        protection that only applies in qualifying self-referral cases — and{" "}
        <strong>Legal / adverse-action hints</strong> for other rights/discipline risks. Don’t read every legal chip
        as Limited Use.
      </p>
      <p>
        <strong>Limited Use Policy (self-referral)</strong> is the AR 600–85 protection for qualifying self-referral
        cases. The rule is cite-don’t-copy: keep the official definition in paragraphs 10–11 through 10–13, and point
        separation and flagging actions to AR 600–8–2, AR 635–200, AR 135–175, AR 135–178, and AR 600–8–24. Limited
        Use is not a shield for later misconduct or for refusing a lawful order to test.
      </p>
      <p>
        <strong>Legal / adverse-action hint</strong> covers testing-basis blur, process-skip, Art. 31 / coercion
        tone, civilian EAP–TDP mix-up, and any other non–Limited Use legal assists.
      </p>

      <h2 className="text-xl font-bold mt-8">Glossary tip — locked terms</h2>
      <p>
        Glossary reminders flag defined terms (ASAP, ADAPT, Limited Use Policy, UDL, MRO, DAMIS, smart testing,
        and others). Do not invent a second definition in a commander’s guide or component chapter. Lock the term
        and cite the glossary or the controlling paragraph.
      </p>

      <h2 className="text-xl font-bold mt-8">Doctrine tip — overlap checks</h2>
      <p>
        Assist runs 22 overlap checks across your draft. For each topic, choose <em>Keep wording</em> or{" "}
        <em>Insert See cite</em>. Inserting a See cite appends the topic’s citation to the current paragraph and
        records the decision.
      </p>

      <h2 className="text-xl font-bold mt-8">Working-copy outline (Editors)</h2>
      <p>
        Use the left outline to reshape <em>your draft</em> only. Every add, split, delete, move, or rename is
        written to the activity list with who, when, the stable paragraph id, and the action. Assist reminders,
        tasks, and checkpoints stay attached to that id even after the display number changes. They never
        rebind against the original regulation.
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Add before / after</strong> — insert a titled paragraph next to the selection. The outline
          stays chapter → numbered paragraph; nested markers such as 4–2a or 4–2a(1) belong in the paragraph
          text box.
        </li>
        <li>
          <strong>Rename</strong> — change the working-copy title. Summary of Change flags it as Revises.
        </li>
        <li>
          <strong>Delete</strong> — confirm first. Assist state for that id is dropped. Summary of Change flags
          it as Rescinds. The original regulation paragraph remains in the read-only pane when you open a
          surviving neighbor.
        </li>
        <li>
          <strong>Split</strong> — insert an empty sibling after the selected paragraph. Glossary, legal chips
          (Limited Use Policy or adverse-action), and Process highlight stay on the source id until you move text
          into the new paragraph.
        </li>
        <li>
          <strong>Drag ::</strong> — reorder in the same chapter or drop on another chapter. Both parents
          renumber (1–1, 1–2… / A–1). Cross-chapter moves appear as Moves in the Summary of Change.
        </li>
      </ul>
      <p>
        Reviewer and Approver can browse the working-copy outline but cannot add, split, delete, move, or
        rename (the server answers 403). Switch the header Role control to try that gate.
      </p>

      <h2 className="text-xl font-bold mt-8">Export and upload</h2>
      <p>
        Word export is always DRAFT-stamped in the header, footer, and title-page disclaimer (AR 25–30 / DA Pam
        25–40). Open <strong>Summary of Change</strong> in the outline (or the Assist <strong>Summary</strong>{" "}
        tab) for an APD-style list of only the paragraphs that differ between the original regulation
        (read-only) and your draft. Export Summary stays marked{" "}
        <em>Summary of Change (DRAFT — working copy; not authenticated under AR 25-30 / DA Pam 25-40)</em>. There is no
        clean non-DRAFT export. Editors and Approvers may upload <strong>.docx</strong>, <strong>.pdf</strong>,
        or <strong>.pptx</strong> files (25 MB). Each upload is recorded with who uploaded it, when, the file
        name, size, and SHA-256. Compare rows are suggestions only (Match / Miss / Unclear) against your
        draft. They never rewrite your draft or the original regulation.
      </p>
    </article>
  );
}
