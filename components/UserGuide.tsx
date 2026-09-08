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
        <li>The gold-and-black DRAFT banner stays on, next to the G–1 seal.</li>
        <li>
          Original regulation (read-only): AR 600–85 (4 Oct 2024, admin revs 27 Feb 2025 / 19 Feb 2026).
        </li>
        <li>
          Your edits save automatically. Editors can also press <strong>Save</strong> next to your draft
          (that writes a “Manual save” line in the activity list). Editors can Undo in your draft (button or
          Ctrl+Z / ⌘Z). The original regulation pane does not undo and is not spellchecked.
        </li>
        <li>Search looks only at the original regulation (read-only).</li>
        <li>Idle warning at 14 minutes; at 15 minutes the current section is saved and the workspace locks.</li>
      </ul>

      <h2 className="text-xl font-bold mt-8">Roles and gates</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Editor</strong> — edit your draft, Save or Undo draft typing, create and complete tasks,
          save checkpoints, record overlap decisions, and upload files to compare against your draft. May
          unlock after an idle lock.
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
        automatic rewrite tool. When the current wording touches a locked glossary term, Limited Use
        protections, or a topic another publication already covers, Assist lists those reminders on the right.
      </p>
      <h3 className="text-lg font-semibold mt-4">How underlined wording appears</h3>
      <p>
        Open a paragraph. If Assist finds matching wording, those terms and topics show up on the Assist tab as
        underlined reminders (locked glossary terms, Limited Use language, or overlap with another publication).
        They are suggestions only. Your draft does not change until you choose an action.
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
        Glossary and Limited Use reminders are informational: they tell you which locked terms or legal topics
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

      <h2 className="text-xl font-bold mt-8">Justice (Limited Use)</h2>
      <p>
        Justice is the working-group legal reviewer. Limited Use chips appear when a paragraph touches
        self-referral protections, protected evidence, or characterization. Justice’s rule is cite-don’t-copy:
        keep the canonical definition in paragraphs 10–11 through 10–13, and steer separation and flagging
        actions to AR 600–8–2, AR 635–200, AR 135–175, AR 135–178, and AR 600–8–24. Limited Use is not a
        shield for later misconduct or for refusing a lawful order to test.
      </p>

      <h2 className="text-xl font-bold mt-8">Cheech (glossary lock)</h2>
      <p>
        Cheech is the terminology lead. Glossary lock chips flag defined terms (ASAP, ADAPT, Limited Use Policy,
        UDL, MRO, DAMIS, smart testing, and others). Do not invent a second definition in a commander’s guide
        or component chapter. Lock the term and cite the glossary / canonical paragraph.
      </p>

      <h2 className="text-xl font-bold mt-8">Sergeant (redundancy)</h2>
      <p>
        Sergeant runs 22 redundancy lanes across the working copy. For each lane, choose <em>Keep wording</em> or{" "}
        <em>Insert See cite</em>. Inserting a See cite appends the lane’s citation to the current paragraph and
        records the decision on the server.
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
