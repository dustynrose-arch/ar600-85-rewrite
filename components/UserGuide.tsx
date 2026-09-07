import { GuideVideo } from "@/components/GuideVideo";
import { GuideWalkthrough } from "@/components/GuideWalkthrough";

export function UserGuide() {
  return (
    <article className="prose prose-slate max-w-none font-doc text-army-ink">
      <p className="mt-4 text-xs font-ui font-bold tracking-[0.2em] text-army-goldDark">USER GUIDE</p>
      <h1 className="text-3xl font-bold mt-1">AR 600–85 Rewrite — Working Copy</h1>
      <p className="text-army-slate">
        Internal G–1 rewrite working group use only. This application never mutates the locked ACTIVE
        baseline.
      </p>

      <GuideVideo />
      <GuideWalkthrough />

      <h2 className="text-xl font-bold mt-10">Workspace</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Three panes: outline, editor, and Assist / authority.</li>
        <li>The gold-and-black DRAFT / WORKING COPY banner is always on.</li>
        <li>Baseline label: ACTIVE AR 600–85 (4 Oct 2024, admin revs 27 Feb 2025 / 19 Feb 2026).</li>
        <li>Section edits autosave on the server. The browser does not keep a localStorage copy.</li>
        <li>Search queries the embedded baseline only.</li>
        <li>Idle warning at 14 minutes; at 15 minutes the current section is saved and the workspace locks.</li>
      </ul>

      <h2 className="text-xl font-bold mt-8">Roles and gates</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Editor</strong> — edit working-copy text, create and complete tasks, take snapshots,
          record Sergeant decisions.
        </li>
        <li>
          <strong>Reviewer</strong> — read-only. May inspect diffs, timeline, and authority chips.
        </li>
        <li>
          <strong>Approver</strong> — read-only text. May mark sections or the full book ready for
          working-group review, and may unlock after an idle lock.
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
        25–40). PDF and DOCX source uploads are capped at 25 MB. Each upload is audited with byte size and
        SHA-256.
      </p>
    </article>
  );
}
