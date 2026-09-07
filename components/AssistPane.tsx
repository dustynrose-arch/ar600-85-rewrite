"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CITE_HOT_LIST, SISTER_PUBS } from "@/lib/seed/sister-pubs";
import { GLOSSARY_TERMS } from "@/lib/seed/glossary";
import { PROCESS_MAP } from "@/lib/seed/process-map";
import type {
  DiffHunk,
  Role,
  SergeantLaneState,
  Snapshot,
  Task,
  TimelineEvent,
  UploadAudit,
  WgReviewMark,
  WorkingSection,
} from "@/lib/types";

type Tab = "assist" | "authority" | "process" | "tasks" | "versions" | "timeline" | "upload";

type SergeantFinding = {
  laneId: string;
  name: string;
  rationale: string;
  primaryCite: string;
  seeCite: string;
  hits: { sectionId: string; number: string; title: string }[];
  decision?: SergeantLaneState;
};

type Props = {
  role: Role;
  locked: boolean;
  sectionId: string;
  working: WorkingSection;
  tasks: Task[];
  snapshots: Omit<Snapshot, "sections">[];
  timeline: TimelineEvent[];
  uploads: UploadAudit[];
  marks: WgReviewMark[];
  wgReady: boolean;
  findings: SergeantFinding[];
  onSelect: (id: string) => void;
  onCreateTask: (title: string, notes: string) => void;
  onCompleteTask: (id: string) => void;
  onSnapshot: (label: string) => void;
  onDiff: (against: string) => Promise<DiffHunk[]>;
  onSummarize: (against: string) => Promise<string[]>;
  onSergeant: (laneId: string, decision: "keep" | "see-cite", citeTo?: string) => void;
  onUpload: (file: File) => Promise<void>;
  onWgMark: (sectionId: string | "all" | "clear") => void;
};

const TABS: { id: Tab; label: string }[] = [
  { id: "assist", label: "Assist" },
  { id: "authority", label: "Authority" },
  { id: "process", label: "Process" },
  { id: "tasks", label: "Tasks" },
  { id: "versions", label: "Versions" },
  { id: "timeline", label: "Timeline" },
  { id: "upload", label: "Upload" },
];

export function AssistPane(props: Props) {
  const [tab, setTab] = useState<Tab>("assist");
  return (
    <aside className="flex flex-col min-h-0 border-l border-army-black/15 bg-[#f7f2e6]">
      <div className="flex flex-wrap gap-1 p-2 border-b border-army-black/10">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-2 py-1 text-[11px] font-semibold ${
              tab === item.id ? "bg-army-olive text-army-cream" : "bg-white text-army-ink border border-army-black/10"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="pane-scroll overflow-y-auto flex-1 min-h-0 p-3 text-sm">
        {tab === "assist" ? <AssistTab {...props} /> : null}
        {tab === "authority" ? <AuthorityTab onSelect={props.onSelect} /> : null}
        {tab === "process" ? <ProcessTab onSelect={props.onSelect} /> : null}
        {tab === "tasks" ? <TasksTab {...props} /> : null}
        {tab === "versions" ? <VersionsTab {...props} /> : null}
        {tab === "timeline" ? <TimelineTab timeline={props.timeline} onSelect={props.onSelect} /> : null}
        {tab === "upload" ? <UploadTab {...props} /> : null}
      </div>
    </aside>
  );
}

function AssistTab({
  sectionId,
  working,
  findings,
  onSelect,
  onSergeant,
  role,
}: Props) {
  const cheech = useMemo(
    () =>
      GLOSSARY_TERMS.filter((term) => {
        const hay = `${working.title} ${working.body}`.toLowerCase();
        return hay.includes(term.term.toLowerCase()) || (term.acronym ? hay.includes(term.acronym.toLowerCase()) : false);
      }),
    [working],
  );
  const justice = /limited use|protected evidence|self-referral|characterization|42 cfr/i.test(
    `${working.title} ${working.body}`,
  );
  const laneHits = findings.filter((finding) => finding.hits.some((hit) => hit.sectionId === sectionId));

  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-[11px] font-bold tracking-[0.16em] text-army-goldDark">CHEECH — GLOSSARY LOCK</h3>
        <p className="text-xs text-army-slate mt-1">
          Locked terms must keep their canonical definition. Cheech flags rewrite drift.
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {cheech.length === 0 ? <span className="text-xs text-army-slate">No locked terms in this paragraph.</span> : null}
          {cheech.map((term) => (
            <span
              key={term.id}
              title={`${term.definition} Cite: ${term.cite}`}
              className="inline-flex items-center gap-1 bg-army-olive text-army-cream px-2 py-0.5 text-[11px]"
            >
              LOCK {term.acronym ?? term.term}
            </span>
          ))}
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-bold tracking-[0.16em] text-army-rust">JUSTICE — LIMITED USE</h3>
        <p className="text-xs text-army-slate mt-1">
          Cite-don’t-copy. Steer flags and separations to sister pubs; do not expand protected evidence.
        </p>
        {justice ? (
          <div className="mt-2 space-y-1.5">
            <span className="inline-block bg-army-rust text-white px-2 py-0.5 text-[11px]">Limited Use in play</span>
            <div className="flex flex-wrap gap-1">
              {["AR 600-8-2", "AR 635-200", "AR 135-175", "AR 135-178"].map((pub) => (
                <span key={pub} className="bg-white border border-army-rust/40 px-2 py-0.5 text-[11px]">
                  STEER {pub}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs mt-2">No Limited Use language in the current paragraph.</p>
        )}
      </section>
      <section>
        <h3 className="text-[11px] font-bold tracking-[0.16em] text-army-oliveDark">SERGEANT — 22 REDUNDANCY LANES</h3>
        <p className="text-xs text-army-slate mt-1">Keep wording or insert a See cite. {findings.length} lanes loaded.</p>
        <ul className="mt-2 space-y-2">
          {(laneHits.length ? laneHits : findings.slice(0, 6)).map((finding) => (
            <li key={finding.laneId} className="border border-army-black/10 bg-white p-2">
              <div className="font-semibold text-[12px]">{finding.name}</div>
              <p className="text-[11px] text-army-slate">{finding.rationale}</p>
              <p className="text-[11px] mt-1">
                Primary {finding.primaryCite}
                {finding.hits.length ? ` · hits ${finding.hits.map((hit) => hit.number).join(", ")}` : ""}
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  disabled={role !== "editor"}
                  onClick={() => onSergeant(finding.laneId, "keep")}
                  className={`text-[11px] px-2 py-1 border ${
                    finding.decision?.decision === "keep" ? "bg-army-olive text-white" : "bg-army-cream"
                  }`}
                >
                  Keep wording
                </button>
                <button
                  type="button"
                  disabled={role !== "editor"}
                  onClick={() => onSergeant(finding.laneId, "see-cite", sectionId)}
                  className={`text-[11px] px-2 py-1 border ${
                    finding.decision?.decision === "see-cite" ? "bg-army-gold" : "bg-army-cream"
                  }`}
                >
                  Insert See cite
                </button>
              </div>
              {finding.hits[0] ? (
                <button type="button" className="text-[11px] underline mt-1" onClick={() => onSelect(finding.primaryCite)}>
                  Open primary cite
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      <Link href="/guide" className="inline-block text-xs underline text-army-goldDark">
        Open User Guide (walkthrough + video)
      </Link>
    </div>
  );
}

function AuthorityTab({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-[11px] font-bold tracking-[0.16em] text-army-rust">CITE-DON’T-COPY HOT LIST</h3>
        <ul className="mt-2 space-y-2">
          {CITE_HOT_LIST.map((item) => (
            <li key={item.id} className="bg-white border border-army-black/10 p-2">
              <div className="font-semibold text-[12px]">{item.topic}</div>
              <div className="text-[11px] text-army-goldDark">{item.cite}</div>
              <p className="text-[11px] mt-1">{item.warning}</p>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="text-[11px] font-bold tracking-[0.16em] text-army-oliveDark">SISTER PUBLICATIONS</h3>
        <ul className="mt-2 space-y-2">
          {SISTER_PUBS.map((pub) => (
            <li key={pub.id} className="bg-white border border-army-black/10 p-2">
              <div className="font-semibold text-[12px]">
                {pub.pub} — {pub.title}
              </div>
              <p className="text-[11px] mt-1">{pub.whyCite}</p>
              <p className="text-[11px] text-army-rust mt-1">{pub.doNotCopy}</p>
            </li>
          ))}
        </ul>
      </section>
      <button type="button" className="text-xs underline" onClick={() => onSelect("A-1")}>
        Open appendix A references
      </button>
    </div>
  );
}

function ProcessTab({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold tracking-[0.16em] text-army-oliveDark">ID → REHAB PROCESS MAP</h3>
      <p className="text-xs text-army-slate mt-1">{PROCESS_MAP.summary}</p>
      <ol className="mt-3 space-y-2">
        {PROCESS_MAP.nodes.map((node) => (
          <li key={node.id} className="bg-white border border-army-black/10 p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-[12px]">{node.label}</span>
              <span className="text-[10px] uppercase tracking-wide text-army-goldDark">{node.kind}</span>
            </div>
            <p className="text-[11px] mt-1">{node.detail}</p>
            <button type="button" className="text-[11px] underline mt-1" onClick={() => onSelect(node.cite)}>
              Open {node.cite}
            </button>
          </li>
        ))}
      </ol>
      <p className="text-[11px] mt-3 font-semibold">Branches</p>
      <ul className="text-[11px] space-y-1 mt-1">
        {PROCESS_MAP.edges.map((edge) => (
          <li key={`${edge.from}-${edge.to}-${edge.label ?? ""}`}>
            {edge.from} → {edge.to}
            {edge.label ? ` (${edge.label})` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TasksTab({ role, tasks, sectionId, onCreateTask, onCompleteTask }: Props) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <div>
      <h3 className="text-[11px] font-bold tracking-[0.16em] text-army-oliveDark">EDITOR TASKS</h3>
      <form
        className="mt-2 space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          onCreateTask(title.trim(), notes);
          setTitle("");
          setNotes("");
        }}
      >
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Task title"
          disabled={role !== "editor"}
          className="w-full border border-army-black/15 px-2 py-1 text-sm"
        />
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Notes"
          disabled={role !== "editor"}
          className="w-full border border-army-black/15 px-2 py-1 text-sm h-16"
        />
        <button
          type="submit"
          disabled={role !== "editor"}
          className="bg-army-olive text-army-cream px-3 py-1 text-xs font-semibold disabled:opacity-50"
        >
          Create task on {sectionId}
        </button>
      </form>
      <ul className="mt-3 space-y-2">
        {tasks.map((task) => (
          <li key={task.id} className="bg-white border border-army-black/10 p-2">
            <div className="font-semibold text-[12px]">{task.title}</div>
            <p className="text-[11px] text-army-slate">{task.notes}</p>
            <p className="text-[11px] mt-1">
              {task.sectionId ?? "unscoped"} · {task.completedAt ? "complete" : "open"}
            </p>
            {!task.completedAt ? (
              <button
                type="button"
                disabled={role !== "editor"}
                onClick={() => onCompleteTask(task.id)}
                className="mt-1 text-[11px] underline disabled:no-underline"
              >
                Complete
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function VersionsTab({
  snapshots,
  onSnapshot,
  onDiff,
  onSummarize,
  role,
}: Props) {
  const [label, setLabel] = useState("");
  const [hunks, setHunks] = useState<DiffHunk[]>([]);
  const [bullets, setBullets] = useState<string[]>([]);
  const [against, setAgainst] = useState("baseline");

  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-bold tracking-[0.16em] text-army-oliveDark">SNAPSHOTS & DIFF</h3>
      <div className="flex gap-2">
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Snapshot label"
          disabled={role !== "editor"}
          className="flex-1 border border-army-black/15 px-2 py-1 text-sm"
        />
        <button
          type="button"
          disabled={role !== "editor"}
          onClick={() => {
            onSnapshot(label);
            setLabel("");
          }}
          className="bg-army-olive text-army-cream px-2 py-1 text-xs font-semibold disabled:opacity-50"
        >
          Save
        </button>
      </div>
      <label className="block text-[11px] font-semibold">
        Compare working copy against
        <select
          value={against}
          onChange={(event) => setAgainst(event.target.value)}
          className="block w-full mt-1 border border-army-black/15 px-2 py-1 text-sm"
        >
          <option value="baseline">Locked baseline</option>
          {snapshots.map((snapshot) => (
            <option key={snapshot.id} value={snapshot.id}>
              {snapshot.label} ({new Date(snapshot.createdAt).toLocaleString()})
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          className="border border-army-black/20 px-2 py-1 text-xs bg-white"
          onClick={async () => setHunks(await onDiff(against))}
        >
          Side-by-side diff
        </button>
        <button
          type="button"
          className="border border-army-black/20 px-2 py-1 text-xs bg-white"
          onClick={async () => setBullets(await onSummarize(against))}
        >
          Summarize from diffs
        </button>
      </div>
      {bullets.length ? (
        <ul className="list-disc pl-4 text-[11px] space-y-1">
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}
      {hunks.map((hunk) => (
        <div key={hunk.sectionId} className="border border-army-black/10 bg-white p-2">
          <div className="font-semibold text-[12px]">
            {hunk.number} {hunk.title}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1 text-[11px]">
            <div>
              <p className="text-army-rust font-bold">Comparison</p>
              <p className="whitespace-pre-wrap">{hunk.baseline}</p>
            </div>
            <div>
              <p className="text-army-oliveDark font-bold">Working copy</p>
              <p className="whitespace-pre-wrap">{hunk.current}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineTab({
  timeline,
  onSelect,
}: {
  timeline: TimelineEvent[];
  onSelect: (id: string) => void;
}) {
  return (
    <ol className="space-y-2">
      {timeline.map((event) => (
        <li key={event.id} className="bg-white border border-army-black/10 p-2">
          <div className="text-[10px] uppercase tracking-wide text-army-slate">
            {new Date(event.at).toLocaleString()} · {event.actor} · {event.kind}
          </div>
          <p className="text-[12px] mt-0.5">{event.summary}</p>
          {event.sectionId ? (
            <button type="button" className="text-[11px] underline" onClick={() => onSelect(event.sectionId!)}>
              Open {event.sectionId}
            </button>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function UploadTab({ uploads, onUpload, onWgMark, role, wgReady, sectionId }: Props) {
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-bold tracking-[0.16em] text-army-oliveDark">SOURCE UPLOAD (25 MB)</h3>
      <p className="text-xs text-army-slate">PDF or DOCX. Size and SHA-256 are written to the audit log.</p>
      <input
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setError(null);
          try {
            await onUpload(file);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
          }
        }}
      />
      {error ? <p className="text-xs text-army-rust">{error}</p> : null}
      <ul className="space-y-2">
        {uploads.map((row) => (
          <li key={row.id} className="bg-white border border-army-black/10 p-2 text-[11px]">
            <div className="font-semibold">{row.filename}</div>
            <div>
              {(row.sizeBytes / 1024).toFixed(1)} KB · SHA-256 {row.sha256}
            </div>
            <div>
              {new Date(row.uploadedAt).toLocaleString()} · {row.uploadedBy}
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-army-black/10 pt-3">
        <h3 className="text-[11px] font-bold tracking-[0.16em] text-army-goldDark">APPROVER WG-REVIEW</h3>
        <p className="text-xs mt-1">{wgReady ? "Working copy is marked ready for WG review." : "Not yet marked ready."}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <button
            type="button"
            disabled={role !== "approver"}
            onClick={() => onWgMark(sectionId)}
            className="text-xs px-2 py-1 bg-army-gold disabled:opacity-50"
          >
            Mark this paragraph
          </button>
          <button
            type="button"
            disabled={role !== "approver"}
            onClick={() => onWgMark("all")}
            className="text-xs px-2 py-1 bg-army-olive text-white disabled:opacity-50"
          >
            Mark ready for WG review
          </button>
          <button
            type="button"
            disabled={role !== "approver"}
            onClick={() => onWgMark("clear")}
            className="text-xs px-2 py-1 border disabled:opacity-50"
          >
            Clear marks
          </button>
        </div>
      </div>
    </div>
  );
}
