import { GuideVideo } from "@/components/GuideVideo";
import { GuideWalkthrough } from "@/components/GuideWalkthrough";

export function UserGuide() {
  return (
    <article className="prose prose-slate max-w-none font-doc text-army-ink">
      <p className="mt-4 text-xs font-ui font-bold tracking-[0.2em] text-army-goldDark">USER GUIDE</p>
      <h1 className="text-3xl font-bold mt-1">AR 600–85 Rewrite — Working Copy</h1>
      <p className="text-army-slate">
        Internal G–1 rewrite working group use only. This application never changes the locked ACTIVE
        baseline.
      </p>

      <GuideVideo />
      <GuideWalkthrough />

      <h2 className="text-xl font-bold mt-10">Workspace</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Three panes: outline on the left, working-copy editor in the center, and Assist on the right.</li>
        <li>
          Use <strong>Hide outline</strong> and <strong>Hide Assist</strong> to widen the center editor. Use{" "}
          <strong>Show outline</strong> or <strong>Show Assist</strong> — or the thin side strips — to bring a
          pane back. The workspace remembers those choices until you close the browser tab.
        </li>
        <li>The gold-and-black DRAFT / WORKING COPY banner stays on, next to the G–1 seal.</li>
        <li>Baseline label: ACTIVE AR 600–85 (4 Oct 2024, admin revs 27 Feb 2025 / 19 Feb 2026).</li>
        <li>Your edits save automatically. This computer does not keep a separate copy.</li>
        <li>Search looks only at the locked official baseline.</li>
        <li>Idle warning at 14 minutes; at 15 minutes the current section is saved and the workspace locks.</li>
      </ul>

      <h2 className="text-xl font-bold mt-8">Roles and gates</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Editor</strong> — edit working-copy text, create and complete tasks, save checkpoints,
          record overlap decisions. May unlock after an idle lock.
        </li>
        <li>
          <strong>Reviewer</strong> — read-only. May inspect comparisons, the activity list, and authority
          reminders. Cannot unlock after an idle lock.
        </li>
        <li>
          <strong>Approver</strong> — read-only text. May mark sections or the full book ready for
          working-group review. May unlock after an idle lock.
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

      <h2 className="text-xl font-bold mt-8">Legal tip — Limited Use</h2>
      <p>
        Limited Use reminders appear when a paragraph touches self-referral protections, protected evidence, or
        characterization. The rule is cite-don’t-copy: keep the official definition in paragraphs 10–11 through
        10–13, and point separation and flagging actions to AR 600–8–2, AR 635–200, AR 135–175, AR 135–178, and
        AR 600–8–24. Limited Use is not a shield for later misconduct or for refusing a lawful order to test.
      </p>

      <h2 className="text-xl font-bold mt-8">Glossary tip — locked terms</h2>
      <p>
        Glossary reminders flag defined terms (ASAP, ADAPT, Limited Use Policy, UDL, MRO, DAMIS, smart testing,
        and others). Do not invent a second definition in a commander’s guide or component chapter. Lock the term
        and cite the glossary or the controlling paragraph.
      </p>

      <h2 className="text-xl font-bold mt-8">Doctrine tip — overlap checks</h2>
      <p>
        Assist runs 22 overlap checks across the working copy. For each topic, choose <em>Keep wording</em> or{" "}
        <em>Insert See cite</em>. Inserting a See cite appends the topic’s citation to the current paragraph and
        records the decision.
      </p>

      <h2 className="text-xl font-bold mt-8">Export and upload</h2>
      <p>
        Word export is always DRAFT-stamped in the header, footer, and title-page disclaimer (AR 25–30 / DA Pam
        25–40). PDF and Word source uploads are capped at 25 MB. Each upload is recorded with the file name,
        size, and a unique file ID.
      </p>
    </article>
  );
}
