import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { flattenSections, sectionMap } from "./baseline";
import { REDUNDANCY_LANES } from "./seed/redundancy-lanes";
import type {
  CrossmatchRow,
  Role,
  SaveSource,
  SergeantLaneState,
  Snapshot,
  Task,
  TimelineEvent,
  UploadAudit,
  WgReviewMark,
  WorkingSection,
  WorkspaceState,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "runtime");
const STORE_PATH = path.join(DATA_DIR, "workspace.json");

function now(): string {
  return new Date().toISOString();
}

function seedWorkingSections(): Record<string, WorkingSection> {
  const seeded: Record<string, WorkingSection> = {};
  for (const section of flattenSections()) {
    seeded[section.id] = {
      ...section,
      updatedAt: now(),
      updatedBy: "editor",
    };
  }
  return seeded;
}

function emptyState(): WorkspaceState {
  return {
    role: "editor",
    locked: false,
    lockedAt: null,
    lockReason: null,
    wgReviewReady: false,
    wgReviewReadyAt: null,
    lastActivityAt: now(),
    workingSections: seedWorkingSections(),
    tasks: [
      {
        id: randomUUID(),
        title: "Reconcile Limited Use definition across 10–12 and B–10",
        notes: "Legal: keep one official definition; commander guide should cite.",
        sectionId: "10-12",
        createdAt: now(),
        createdBy: "editor",
        completedAt: null,
        completedBy: null,
      },
    ],
    snapshots: [],
    timeline: [
      {
        id: randomUUID(),
        at: now(),
        actor: "editor",
        kind: "seed",
        summary: "Your draft was initialized from ACTIVE AR 600-85. The original regulation remains read-only.",
      },
    ],
    uploads: [],
    wgReviewMarks: [],
    sergeant: REDUNDANCY_LANES.map((lane) => ({ laneId: lane.id, decision: null })),
  };
}

function isSeedStub(body: string): boolean {
  return /^\s*Working-copy baseline text for/i.test(body);
}

function isMarkerOnlySeed(body: string): boolean {
  const stripped = body
    .replace(/^[ \t]*[a-z]\.\s*/gim, "")
    .replace(/^[ \t]*\([0-9]+\)\s*/gim, "")
    .replace(/^[ \t]*\([a-z]\)\s*/gim, "")
    .replace(/^[ \t]*\([ivxlcdm]+\)\s*/gim, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length < 20;
}

function collapseStructure(body: string): string {
  return body.replace(/^[ \t]+/gm, "").replace(/\r/g, "").trim();
}

function isWrappedSkeleton(body: string): boolean {
  return /\n\nb\.\n {2}\(1\)\n {2}\(2\)\n {2}\(3\)\nc\.\s*$/u.test(body);
}

function needsSeedRefresh(workingBody: string, baselineBody: string): boolean {
  if (isSeedStub(workingBody) || isMarkerOnlySeed(workingBody) || isWrappedSkeleton(workingBody)) {
    return true;
  }
  if (collapseStructure(workingBody) === collapseStructure(baselineBody)) {
    return workingBody !== baselineBody;
  }
  return false;
}

function ensureStore(): WorkspaceState {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(STORE_PATH)) {
    const initial = emptyState();
    writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as WorkspaceState;
  for (const upload of parsed.uploads ?? []) {
    if (!upload.findings) upload.findings = [];
  }
  const baseline = sectionMap();
  let changed = false;
  for (const section of Object.values(baseline)) {
    if (!parsed.workingSections[section.id]) {
      parsed.workingSections[section.id] = { ...section, updatedAt: now(), updatedBy: "editor" };
      changed = true;
      continue;
    }
    if (needsSeedRefresh(parsed.workingSections[section.id].body, section.body)) {
      parsed.workingSections[section.id] = {
        ...parsed.workingSections[section.id],
        body: section.body,
        updatedAt: now(),
      };
      changed = true;
    }
  }
  if (changed) persist(parsed);
  return parsed;
}

function persist(state: WorkspaceState): WorkspaceState {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(state, null, 2));
  return state;
}

function pushEvent(state: WorkspaceState, event: Omit<TimelineEvent, "id" | "at">): void {
  state.timeline.unshift({ id: randomUUID(), at: now(), ...event });
  state.timeline = state.timeline.slice(0, 400);
  state.lastActivityAt = now();
}

export function readState(): WorkspaceState {
  return ensureStore();
}

export function touchActivity(): WorkspaceState {
  const state = ensureStore();
  state.lastActivityAt = now();
  return persist(state);
}

export function setRole(role: Role): WorkspaceState {
  const state = ensureStore();
  state.role = role;
  pushEvent(state, { actor: role, kind: "role", summary: `Active role set to ${role}.` });
  return persist(state);
}

export function saveSection(
  sectionId: string,
  body: string,
  title: string | undefined,
  role: Role,
  source: SaveSource = "autosave",
): WorkspaceState {
  const state = ensureStore();
  if (state.locked) throw new Error("Workspace is locked. Unlock before editing.");
  if (role !== "editor") throw new Error("Only Editors may change working-copy text.");
  const current = state.workingSections[sectionId];
  if (!current) throw new Error(`Unknown section ${sectionId}`);
  state.workingSections[sectionId] = {
    ...current,
    title: title ?? current.title,
    body,
    updatedAt: now(),
    updatedBy: role,
  };
  const manual = source === "manual";
  pushEvent(state, {
    actor: role,
    kind: manual ? "manual-save" : "edit",
    summary: manual
      ? `Manual save of ${current.number} ${current.title}.`
      : `Autosaved ${current.number} ${current.title}.`,
    sectionId,
  });
  return persist(state);
}

export function createTask(input: { title: string; notes?: string; sectionId?: string | null }, role: Role): WorkspaceState {
  const state = ensureStore();
  if (role !== "editor") throw new Error("Only Editors may create tasks.");
  const task: Task = {
    id: randomUUID(),
    title: input.title,
    notes: input.notes ?? "",
    sectionId: input.sectionId ?? null,
    createdAt: now(),
    createdBy: role,
    completedAt: null,
    completedBy: null,
  };
  state.tasks.unshift(task);
  pushEvent(state, { actor: role, kind: "task-create", summary: `Created task: ${task.title}`, sectionId: task.sectionId ?? undefined });
  return persist(state);
}

export function completeTask(taskId: string, role: Role): WorkspaceState {
  const state = ensureStore();
  if (role !== "editor") throw new Error("Only Editors may complete tasks.");
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) throw new Error("Task not found.");
  task.completedAt = now();
  task.completedBy = role;
  pushEvent(state, { actor: role, kind: "task-complete", summary: `Completed task: ${task.title}`, sectionId: task.sectionId ?? undefined });
  return persist(state);
}

export function createSnapshot(label: string, role: Role): WorkspaceState {
  const state = ensureStore();
  if (role !== "editor") throw new Error("Only Editors may create snapshots.");
  const snapshot: Snapshot = {
    id: randomUUID(),
    label: label || `Snapshot ${state.snapshots.length + 1}`,
    createdAt: now(),
    createdBy: role,
    sections: structuredClone(state.workingSections),
  };
  state.snapshots.unshift(snapshot);
  pushEvent(state, { actor: role, kind: "snapshot", summary: `Saved snapshot “${snapshot.label}”.` });
  return persist(state);
}

export function lockWorkspace(reason: string, role: Role): WorkspaceState {
  const state = ensureStore();
  state.locked = true;
  state.lockedAt = now();
  state.lockReason = reason;
  pushEvent(state, { actor: role, kind: "lock", summary: `Workspace locked: ${reason}` });
  return persist(state);
}

export function unlockWorkspace(role: Role): WorkspaceState {
  const state = ensureStore();
  if (role !== "editor" && role !== "approver") throw new Error("Only Editors or Approvers may unlock.");
  state.locked = false;
  state.lockedAt = null;
  state.lockReason = null;
  pushEvent(state, { actor: role, kind: "unlock", summary: "Workspace unlocked." });
  return persist(state);
}

export function markWgReview(sectionId: string | "all" | "clear", role: Role): WorkspaceState {
  const state = ensureStore();
  if (role !== "approver") throw new Error("Only Approvers may mark ready for working-group review.");
  if (sectionId === "clear") {
    state.wgReviewMarks = [];
    state.wgReviewReady = false;
    state.wgReviewReadyAt = null;
    pushEvent(state, { actor: role, kind: "wg-clear", summary: "Cleared ready-for-WG-review marks." });
    return persist(state);
  }
  if (sectionId === "all") {
    state.wgReviewReady = true;
    state.wgReviewReadyAt = now();
    state.wgReviewMarks = flattenSections().map((section) => ({
      sectionId: section.id,
      markedAt: now(),
      markedBy: role,
    }));
    pushEvent(state, { actor: role, kind: "wg-ready", summary: "Approver marked the working copy ready for WG review." });
    return persist(state);
  }
  const existing = state.wgReviewMarks.find((mark) => mark.sectionId === sectionId);
  if (!existing) {
    state.wgReviewMarks.push({ sectionId, markedAt: now(), markedBy: role });
  }
  pushEvent(state, { actor: role, kind: "wg-mark", summary: `Approver marked ${sectionId} ready for WG review.`, sectionId });
  return persist(state);
}

export function setSergeantDecision(laneId: string, decision: SergeantLaneState["decision"], citeTo: string | undefined, role: Role): WorkspaceState {
  const state = ensureStore();
  if (role !== "editor") throw new Error("Only Editors may record overlap decisions.");
  const row = state.sergeant.find((item) => item.laneId === laneId);
  if (!row) throw new Error("Unknown lane.");
  row.decision = decision;
  row.citeTo = citeTo;
  row.decidedAt = now();
  if (decision === "see-cite" && citeTo) {
    const target = state.workingSections[citeTo];
    const lane = REDUNDANCY_LANES.find((item) => item.id === laneId);
    if (target && lane) {
      const insert = `\n\n${lane.seeCite}`;
      if (!target.body.includes(lane.seeCite)) {
        target.body = `${target.body.trim()}${insert}`;
        target.updatedAt = now();
        target.updatedBy = role;
      }
    }
  }
  pushEvent(state, {
    actor: role,
    kind: "sergeant",
    summary: `Overlap check ${laneId}: ${decision === "see-cite" ? "Insert See cite" : "Keep wording"}.`,
  });
  return persist(state);
}

export function recordUpload(meta: Omit<UploadAudit, "id" | "uploadedAt">): WorkspaceState {
  const state = ensureStore();
  const row: UploadAudit = {
    ...meta,
    id: randomUUID(),
    uploadedAt: now(),
    findings: meta.findings ?? [],
  };
  state.uploads.unshift(row);
  const counts = row.findings.reduce(
    (acc, item) => {
      acc[item.verdict] += 1;
      return acc;
    },
    { match: 0, miss: 0, unclear: 0 },
  );
  pushEvent(state, {
    actor: meta.uploadedBy,
    kind: "upload",
    summary: `Uploaded ${meta.filename} (${meta.sizeBytes} bytes, file ID ${meta.sha256.slice(0, 12)}…). Compare to your draft: ${counts.match} match, ${counts.miss} miss, ${counts.unclear} unclear. Suggestions only — your draft and the original regulation were not changed.`,
  });
  return persist(state);
}

export function updateUploadFindings(uploadId: string, findings: CrossmatchRow[], role: Role): WorkspaceState {
  const state = ensureStore();
  if (role !== "editor" && role !== "approver") {
    throw new Error("Only Editors or Approvers may compare uploads to your draft.");
  }
  const row = state.uploads.find((item) => item.id === uploadId);
  if (!row) throw new Error("Upload not found.");
  row.findings = findings;
  pushEvent(state, {
    actor: role,
    kind: "crossmatch",
    summary: `Compared ${row.filename} to your draft (${findings.length} suggestion rows). Nothing in your draft or the original regulation was changed.`,
  });
  return persist(state);
}

export function uploadDiskPath(storedAs: string): string {
  return path.join(process.cwd(), "data", "uploads", storedAs);
}

export function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function publicState() {
  const state = ensureStore();
  const baseline = flattenSections();
  return {
    role: state.role,
    locked: state.locked,
    lockedAt: state.lockedAt,
    lockReason: state.lockReason,
    wgReviewReady: state.wgReviewReady,
    wgReviewReadyAt: state.wgReviewReadyAt,
    lastActivityAt: state.lastActivityAt,
    tasks: state.tasks,
    snapshots: state.snapshots.map(({ sections: _sections, ...rest }) => rest),
    timeline: state.timeline,
    uploads: state.uploads,
    wgReviewMarks: state.wgReviewMarks,
    sergeant: state.sergeant,
    workingSections: state.workingSections,
    baselineSections: Object.fromEntries(baseline.map((section) => [section.id, section])),
  };
}
