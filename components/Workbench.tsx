"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DraftBanner } from "@/components/DraftBanner";
import { OutlinePane } from "@/components/OutlinePane";
import { EditorPane } from "@/components/EditorPane";
import { AssistPane } from "@/components/AssistPane";
import { IdleGuard } from "@/components/IdleGuard";
import { CollapsedRail } from "@/components/PaneToggle";
import { DEFAULT_PANE_STATE, readPaneSession, writePaneSession } from "@/lib/panes";
import { canUnlock, ROLE_LABEL } from "@/lib/roles";
import {
  BASELINE_LABEL,
  type BaselineDocument,
  type DiffHunk,
  type Role,
  type SearchHit,
  type Section,
  type SergeantLaneState,
  type Snapshot,
  type Task,
  type TimelineEvent,
  type UploadAudit,
  type WgReviewMark,
  type WorkingSection,
} from "@/lib/types";

type PublicState = {
  role: Role;
  locked: boolean;
  lockedAt: string | null;
  lockReason: string | null;
  wgReviewReady: boolean;
  wgReviewReadyAt: string | null;
  lastActivityAt: string;
  tasks: Task[];
  snapshots: Omit<Snapshot, "sections">[];
  timeline: TimelineEvent[];
  uploads: UploadAudit[];
  wgReviewMarks: WgReviewMark[];
  sergeant: SergeantLaneState[];
  workingSections: Record<string, WorkingSection>;
  baselineSections: Record<string, Section>;
};

type Finding = {
  laneId: string;
  name: string;
  rationale: string;
  primaryCite: string;
  seeCite: string;
  hits: { sectionId: string; number: string; title: string }[];
  decision?: SergeantLaneState;
};

export function Workbench({
  baseline,
  initialState,
}: {
  baseline: BaselineDocument;
  initialState: PublicState;
}) {
  const [state, setState] = useState(initialState);
  const [selectedId, setSelectedId] = useState(baseline.chapters[0]?.sections[0]?.id ?? "1-1");
  const [draft, setDraft] = useState(initialState.workingSections[selectedId]?.body ?? "");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "dirty" | "blocked">("saved");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [compareBody, setCompareBody] = useState<string | undefined>();
  const [compareLabel, setCompareLabel] = useState<string | undefined>();
  const [leftCollapsed, setLeftCollapsed] = useState(DEFAULT_PANE_STATE.leftCollapsed);
  const [rightCollapsed, setRightCollapsed] = useState(DEFAULT_PANE_STATE.rightCollapsed);
  const [panesReady, setPanesReady] = useState(false);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    const stored = readPaneSession();
    setLeftCollapsed(stored.leftCollapsed);
    setRightCollapsed(stored.rightCollapsed);
    setPanesReady(true);
  }, []);

  useEffect(() => {
    if (!panesReady) return;
    writePaneSession({ leftCollapsed, rightCollapsed });
  }, [panesReady, leftCollapsed, rightCollapsed]);

  const working = state.workingSections[selectedId];
  const baselineSection = state.baselineSections[selectedId] ?? working;

  useEffect(() => {
    setDraft(state.workingSections[selectedId]?.body ?? "");
    setSaveState(state.role === "editor" && !state.locked ? "saved" : "blocked");
  }, [selectedId, state.workingSections, state.role, state.locked]);

  useEffect(() => {
    void fetch("/api/sergeant")
      .then((res) => res.json())
      .then((data) => setFindings(data.findings ?? []));
  }, [state.sergeant, state.workingSections]);

  useEffect(() => {
    if (!query.trim()) {
      setHits([]);
      return;
    }
    const handle = window.setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = (await res.json()) as { hits: SearchHit[] };
      setHits(data.hits);
      setSearching(false);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query]);

  const applyState = (next: PublicState) => {
    setState(next);
  };

  const persistDraft = useCallback(
    async (sectionId: string, body: string, role: Role) => {
      if (role !== "editor" || state.locked) return;
      setSaveState("saving");
      const res = await fetch("/api/section", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId, body, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveState("blocked");
        return;
      }
      applyState(data);
      setSaveState("saved");
    },
    [state.locked],
  );

  const onChange = (value: string) => {
    setDraft(value);
    if (state.role !== "editor" || state.locked) {
      setSaveState("blocked");
      return;
    }
    setSaveState("dirty");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void persistDraft(selectedId, value, state.role);
    }, 800);
  };

  const changeRole = async (role: Role) => {
    const res = await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "role", role }),
    });
    applyState(await res.json());
  };

  const unlock = async () => {
    const res = await fetch("/api/lock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unlock", role: state.role }),
    });
    const data = await res.json();
    if (res.ok) applyState(data);
  };

  const changedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [id, section] of Object.entries(state.workingSections)) {
      if (section.body !== state.baselineSections[id]?.body) ids.add(id);
    }
    return ids;
  }, [state.workingSections, state.baselineSections]);

  const markedIds = useMemo(() => new Set(state.wgReviewMarks.map((mark) => mark.sectionId)), [state.wgReviewMarks]);

  if (!working) return null;

  return (
    <div className="h-screen flex flex-col bg-army-cream">
      <IdleGuard
        role={state.role}
        locked={state.locked}
        sectionId={selectedId}
        draftBody={draft}
        onLocked={async () => {
          const res = await fetch("/api/state");
          applyState(await res.json());
        }}
      />
      <header className="shrink-0 bg-army-black text-army-cream px-4 py-2 flex items-center gap-4">
        <img
          src="/g1-seal.png"
          alt="Office of the Deputy Chief of Staff, G-1, United States Army seal"
          className="h-12 w-12 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold leading-tight">AR 600-85 Rewrite — Working Copy</h1>
          <p className="text-xs text-army-gold">Internal G-1 rewrite working group use only</p>
          <p className="text-[11px] text-army-cream/80">{BASELINE_LABEL}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <label className="flex items-center gap-1">
            Role
            <select
              value={state.role}
              onChange={(event) => void changeRole(event.target.value as Role)}
              className="bg-army-ink text-army-cream border border-army-gold/40 px-1 py-0.5"
            >
              {(Object.keys(ROLE_LABEL) as Role[]).map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABEL[role]}
                </option>
              ))}
            </select>
          </label>
          <a href="/api/export" className="bg-army-gold text-army-black px-2 py-1 font-semibold">
            Export Word (DRAFT)
          </a>
          <a href="/guide" className="border border-army-gold/50 px-2 py-1">
            User Guide
          </a>
        </div>
      </header>
      <DraftBanner />
      {state.locked ? (
        <div className="shrink-0 bg-army-rust text-white text-xs px-4 py-1.5 flex items-center justify-between">
          <span>LOCKED{state.lockReason ? ` — ${state.lockReason}` : ""}. Working copy was saved. Baseline is untouched.</span>
          {canUnlock(state.role) ? (
            <button type="button" onClick={() => void unlock()} className="underline">
              Unlock
            </button>
          ) : null}
        </div>
      ) : null}
      {state.wgReviewReady ? (
        <div className="shrink-0 bg-army-olive text-army-cream text-xs px-4 py-1">
          Approver marked this working copy ready for working-group review.
        </div>
      ) : null}
      <div className="flex-1 min-h-0 flex">
        {leftCollapsed ? (
          <CollapsedRail side="left" label="Show outline" onExpand={() => setLeftCollapsed(false)} />
        ) : (
          <div className="w-[280px] max-w-[42%] shrink-0 min-w-0 min-h-0 flex flex-col">
            <OutlinePane
              baseline={baseline}
              selectedId={selectedId}
              onSelect={setSelectedId}
              query={query}
              onQuery={setQuery}
              hits={hits}
              searching={searching}
              changedIds={changedIds}
              markedIds={markedIds}
              onCollapse={() => setLeftCollapsed(true)}
            />
          </div>
        )}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
          <EditorPane
            role={state.role}
            locked={state.locked}
            baseline={baselineSection}
            working={working}
            draft={draft}
            saveState={saveState}
            onChange={onChange}
            compareBody={compareBody}
            compareLabel={compareLabel}
            leftCollapsed={leftCollapsed}
            rightCollapsed={rightCollapsed}
            onToggleLeft={() => setLeftCollapsed((value) => !value)}
            onToggleRight={() => setRightCollapsed((value) => !value)}
          />
        </div>
        {rightCollapsed ? (
          <CollapsedRail side="right" label="Show Assist" onExpand={() => setRightCollapsed(false)} />
        ) : (
          <div className="w-[340px] max-w-[46%] shrink-0 min-w-0 min-h-0 flex flex-col">
            <AssistPane
              role={state.role}
              locked={state.locked}
              sectionId={selectedId}
              working={working}
              tasks={state.tasks}
              snapshots={state.snapshots}
              timeline={state.timeline}
              uploads={state.uploads}
              marks={state.wgReviewMarks}
              wgReady={state.wgReviewReady}
              findings={findings}
              onSelect={setSelectedId}
          onCreateTask={async (title, notes) => {
            const res = await fetch("/api/tasks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "create", title, notes, sectionId: selectedId, role: state.role }),
            });
            applyState(await res.json());
          }}
          onCompleteTask={async (taskId) => {
            const res = await fetch("/api/tasks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "complete", taskId, role: state.role }),
            });
            applyState(await res.json());
          }}
          onSnapshot={async (label) => {
            const res = await fetch("/api/snapshots", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ label, role: state.role }),
            });
            applyState(await res.json());
          }}
          onDiff={async (against) => {
            const res = await fetch(`/api/diff?against=${encodeURIComponent(against)}`);
            const data = (await res.json()) as { hunks: DiffHunk[] };
            const first = data.hunks[0];
            if (first) {
              setCompareBody(first.baseline);
              setCompareLabel(against === "baseline" ? "Locked baseline" : "Saved checkpoint");
            }
            return data.hunks;
          }}
          onSummarize={async (against) => {
            const res = await fetch("/api/summarize", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ against }),
            });
            const data = (await res.json()) as { bullets: string[] };
            return data.bullets;
          }}
          onSergeant={async (laneId, decision, citeTo) => {
            const res = await fetch("/api/sergeant", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ laneId, decision, citeTo, role: state.role }),
            });
            const data = await res.json();
            if (res.ok) {
              applyState(data);
              setFindings(data.findings ?? []);
            }
          }}
          onUpload={async (file) => {
            const form = new FormData();
            form.set("file", file);
            form.set("role", state.role);
            const res = await fetch("/api/upload", { method: "POST", body: form });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Upload failed");
            applyState(data);
          }}
          onWgMark={async (sectionId) => {
            const res = await fetch("/api/wg-review", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sectionId, role: state.role }),
            });
            const data = await res.json();
            if (res.ok) applyState(data);
          }}
              onCollapse={() => setRightCollapsed(true)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
