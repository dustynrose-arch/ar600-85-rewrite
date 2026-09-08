import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  bindingFromWorking,
  dropAssistState,
  emptyAssistBinding,
  seedAssistBindings,
} from "./assist-bind";
import { baselineDocument, flattenSections, sectionMap } from "./baseline";
import {
  applyDisplayNumbers,
  deleteSectionId,
  firstSectionId,
  flattenOutlineSections,
  insertSectionId,
  moveSectionId,
  seedWorkingOutline,
} from "./outline";
import { ForbiddenError } from "./roles";
import { REDUNDANCY_LANES } from "./seed/redundancy-lanes";
import { ensureDataDir, storePaths, wipeUploadsDir } from "./store-paths";
import type {
  CrossmatchRow,
  Role,
  SaveSource,
  SergeantLaneState,
  Snapshot,
  StructurePosition,
  Task,
  TimelineEvent,
  UploadAudit,
  WgReviewMark,
  WorkingOutlineChapter,
  WorkingSection,
  WorkspaceMode,
  WorkspaceState,
} from "./types";

export { storePaths } from "./store-paths";

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

function emptyState(mode: WorkspaceMode): WorkspaceState {
  const workingSections = seedWorkingSections();
  const seedSummary =
    mode === "training"
      ? "Training copy initialized from ACTIVE AR 600-85. Practice here — live workspace is unchanged."
      : "Your draft was initialized from ACTIVE AR 600-85. The original regulation remains read-only.";
  return {
    role: "editor",
    locked: false,
    lockedAt: null,
    lockReason: null,
    wgReviewReady: false,
    wgReviewReadyAt: null,
    lastActivityAt: now(),
    workingSections,
    workingOutline: seedWorkingOutline(baselineDocument),
    assistBindings: seedAssistBindings(workingSections),
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
        summary: seedSummary,
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

function ensureStore(mode: WorkspaceMode): WorkspaceState {
  const { storePath } = storePaths(mode);
  ensureDataDir(mode);
  if (!existsSync(storePath)) {
    const initial = emptyState(mode);
    writeFileSync(storePath, JSON.stringify(initial, null, 2));
    return initial;
  }
  const parsed = JSON.parse(readFileSync(storePath, "utf8")) as WorkspaceState;
  for (const upload of parsed.uploads ?? []) {
    if (!upload.findings) upload.findings = [];
  }
  const baseline = sectionMap();
  let changed = false;
  const hadOutline = Array.isArray(parsed.workingOutline) && parsed.workingOutline.length > 0;
  if (!hadOutline) {
    parsed.workingOutline = seedWorkingOutline(baselineDocument);
    changed = true;
  }
  for (const section of Object.values(baseline)) {
    const working = parsed.workingSections[section.id];
    if (!working) {
      if (!hadOutline) {
        parsed.workingSections[section.id] = { ...section, updatedAt: now(), updatedBy: "editor" };
        changed = true;
      }
      continue;
    }
    if (needsSeedRefresh(working.body, section.body)) {
      parsed.workingSections[section.id] = {
        ...working,
        body: section.body,
        updatedAt: now(),
      };
      changed = true;
    }
  }
  if (!parsed.assistBindings || Object.keys(parsed.assistBindings).length === 0) {
    parsed.assistBindings = seedAssistBindings(parsed.workingSections);
    changed = true;
  }
  if (changed) persist(parsed, mode);
  return parsed;
}

function assertCanEditStructure(state: WorkspaceState, role: Role): void {
  if (state.locked) throw new Error("Workspace is locked. Unlock before editing.");
  if (role !== "editor") {
    throw new ForbiddenError("Only Editors may change working-copy structure.");
  }
}

function renumberWorkingCopy(state: WorkspaceState): void {
  applyDisplayNumbers(state.workingOutline, state.workingSections);
}

function chapterLabel(state: WorkspaceState, chapterId: string): string {
  const chapter = state.workingOutline.find((item) => item.id === chapterId);
  if (!chapter) return chapterId;
  const peers = state.workingOutline.filter((item) => item.kind === chapter.kind);
  const index = peers.findIndex((item) => item.id === chapter.id);
  if (chapter.kind === "appendix") return `Appendix ${String.fromCharCode(65 + Math.max(0, index))}`;
  return `Chapter ${index + 1}`;
}

function persist(state: WorkspaceState, mode: WorkspaceMode): WorkspaceState {
  const { storePath } = storePaths(mode);
  ensureDataDir(mode);
  writeFileSync(storePath, JSON.stringify(state, null, 2));
  return state;
}

function pushEvent(state: WorkspaceState, event: Omit<TimelineEvent, "id" | "at">): void {
  state.timeline.unshift({ id: randomUUID(), at: now(), ...event });
  state.timeline = state.timeline.slice(0, 400);
  state.lastActivityAt = now();
}

export function readState(mode: WorkspaceMode): WorkspaceState {
  return ensureStore(mode);
}

export function touchActivity(mode: WorkspaceMode): WorkspaceState {
  const state = ensureStore(mode);
  state.lastActivityAt = now();
  return persist(state, mode);
}

export function setRole(role: Role, mode: WorkspaceMode): WorkspaceState {
  const state = ensureStore(mode);
  state.role = role;
  pushEvent(state, { actor: role, kind: "role", summary: `Active role set to ${role}.` });
  return persist(state, mode);
}

export function saveSection(
  sectionId: string,
  body: string,
  title: string | undefined,
  role: Role,
  mode: WorkspaceMode,
  source: SaveSource = "autosave",
): WorkspaceState {
  const state = ensureStore(mode);
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
  const saved = state.workingSections[sectionId];
  state.assistBindings[sectionId] = bindingFromWorking(saved);
  const manual = source === "manual";
  pushEvent(state, {
    actor: role,
    kind: manual ? "manual-save" : "edit",
    summary: manual
      ? `Manual save of ${current.number} ${current.title}.`
      : `Autosaved ${current.number} ${current.title}.`,
    sectionId,
  });
  return persist(state, mode);
}

export function createTask(input: { title: string; notes?: string; sectionId?: string | null }, role: Role, mode: WorkspaceMode): WorkspaceState {
  const state = ensureStore(mode);
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
  return persist(state, mode);
}

export function completeTask(taskId: string, role: Role, mode: WorkspaceMode): WorkspaceState {
  const state = ensureStore(mode);
  if (role !== "editor") throw new Error("Only Editors may complete tasks.");
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) throw new Error("Task not found.");
  task.completedAt = now();
  task.completedBy = role;
  pushEvent(state, { actor: role, kind: "task-complete", summary: `Completed task: ${task.title}`, sectionId: task.sectionId ?? undefined });
  return persist(state, mode);
}

export function createSnapshot(label: string, role: Role, mode: WorkspaceMode): WorkspaceState {
  const state = ensureStore(mode);
  if (role !== "editor") throw new Error("Only Editors may create snapshots.");
  const snapshot: Snapshot = {
    id: randomUUID(),
    label: label || `Snapshot ${state.snapshots.length + 1}`,
    createdAt: now(),
    createdBy: role,
    sections: structuredClone(state.workingSections),
    outline: structuredClone(state.workingOutline),
  };
  state.snapshots.unshift(snapshot);
  pushEvent(state, { actor: role, kind: "snapshot", summary: `Saved snapshot “${snapshot.label}”.` });
  return persist(state, mode);
}

export function lockWorkspace(reason: string, role: Role, mode: WorkspaceMode): WorkspaceState {
  const state = ensureStore(mode);
  state.locked = true;
  state.lockedAt = now();
  state.lockReason = reason;
  pushEvent(state, { actor: role, kind: "lock", summary: `Workspace locked: ${reason}` });
  return persist(state, mode);
}

export function unlockWorkspace(role: Role, mode: WorkspaceMode): WorkspaceState {
  const state = ensureStore(mode);
  if (role !== "editor" && role !== "approver") throw new Error("Only Editors or Approvers may unlock.");
  state.locked = false;
  state.lockedAt = null;
  state.lockReason = null;
  pushEvent(state, { actor: role, kind: "unlock", summary: "Workspace unlocked." });
  return persist(state, mode);
}

export function markWgReview(sectionId: string | "all" | "clear", role: Role, mode: WorkspaceMode): WorkspaceState {
  const state = ensureStore(mode);
  if (role !== "approver") throw new Error("Only Approvers may mark ready for working-group review.");
  if (sectionId === "clear") {
    state.wgReviewMarks = [];
    state.wgReviewReady = false;
    state.wgReviewReadyAt = null;
    pushEvent(state, { actor: role, kind: "wg-clear", summary: "Cleared ready-for-WG-review marks." });
    return persist(state, mode);
  }
  if (sectionId === "all") {
    state.wgReviewReady = true;
    state.wgReviewReadyAt = now();
    state.wgReviewMarks = flattenOutlineSections(state.workingOutline, state.workingSections).map((section) => ({
      sectionId: section.id,
      markedAt: now(),
      markedBy: role,
    }));
    pushEvent(state, { actor: role, kind: "wg-ready", summary: "Approver marked the working copy ready for WG review." });
    return persist(state, mode);
  }
  const existing = state.wgReviewMarks.find((mark) => mark.sectionId === sectionId);
  if (!existing) {
    state.wgReviewMarks.push({ sectionId, markedAt: now(), markedBy: role });
  }
  pushEvent(state, { actor: role, kind: "wg-mark", summary: `Approver marked ${sectionId} ready for WG review.`, sectionId });
  return persist(state, mode);
}

export function setSergeantDecision(laneId: string, decision: SergeantLaneState["decision"], citeTo: string | undefined, role: Role, mode: WorkspaceMode): WorkspaceState {
  const state = ensureStore(mode);
  if (role !== "editor") throw new Error("Only Editors may record overlap decisions.");
  const row = state.sergeant.find((item) => item.laneId === laneId);
  if (!row) throw new Error("Unknown lane.");
  row.decision = decision;
  row.citeTo = citeTo;
  row.decidedAt = now();
  if (decision === "see-cite" && citeTo) {
    const target = state.workingSections[citeTo];
    const lane = REDUNDANCY_LANES.find((item) => item.id === laneId);
    if (target && target.id === citeTo && lane) {
      const insert = `\n\n${lane.seeCite}`;
      if (!target.body.includes(lane.seeCite)) {
        target.body = `${target.body.trim()}${insert}`;
        target.updatedAt = now();
        target.updatedBy = role;
        state.assistBindings[target.id] = bindingFromWorking(target);
      }
    }
  }
  pushEvent(state, {
    actor: role,
    kind: "sergeant",
    summary: `Overlap check ${laneId}: ${decision === "see-cite" ? "Insert See cite" : "Keep wording"}.`,
  });
  return persist(state, mode);
}

export function recordUpload(meta: Omit<UploadAudit, "id" | "uploadedAt">, mode: WorkspaceMode): WorkspaceState {
  const state = ensureStore(mode);
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
  return persist(state, mode);
}

export function updateUploadFindings(uploadId: string, findings: CrossmatchRow[], role: Role, mode: WorkspaceMode): WorkspaceState {
  const state = ensureStore(mode);
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
  return persist(state, mode);
}

export function uploadDiskPath(storedAs: string, mode: WorkspaceMode): string {
  return path.join(storePaths(mode).uploadsDir, storedAs);
}

export function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function addWorkingSection(
  input: { targetId: string; position: StructurePosition; title?: string },
  role: Role,
  mode: WorkspaceMode,
): WorkspaceState {
  const state = ensureStore(mode);
  assertCanEditStructure(state, role);
  const title = (input.title ?? "New paragraph").trim() || "New paragraph";
  const id = `wc-${randomUUID()}`;
  const parentHint = state.workingOutline.find((chapter) => chapter.id === input.targetId)?.id;
  state.workingSections[id] = {
    id,
    number: "",
    title,
    body: "",
    updatedAt: now(),
    updatedBy: role,
  };
  state.workingOutline = insertSectionId(state.workingOutline, id, input.targetId, input.position);
  state.assistBindings[id] = emptyAssistBinding(id);
  renumberWorkingCopy(state);
  const created = state.workingSections[id];
  const parent = state.workingOutline.find((chapter) => chapter.sectionIds.includes(id));
  pushEvent(state, {
    actor: role,
    kind: "structure-add",
    summary: `Added paragraph “${title}” (${id}) as ${created.number} under ${parent ? chapterLabel(state, parent.id) : parentHint ?? "the working copy"}.`,
    sectionId: id,
  });
  return persist(state, mode);
}

export function deleteWorkingSection(sectionId: string, role: Role, mode: WorkspaceMode): WorkspaceState {
  const state = ensureStore(mode);
  assertCanEditStructure(state, role);
  const current = state.workingSections[sectionId];
  if (!current) throw new Error(`Unknown section ${sectionId}`);
  if (flattenOutlineSections(state.workingOutline, state.workingSections).length <= 1) {
    throw new Error("Cannot delete the last working-copy paragraph.");
  }
  const removed = deleteSectionId(state.workingOutline, sectionId);
  state.workingOutline = removed.outline;
  delete state.workingSections[sectionId];
  dropAssistState(state, sectionId);
  renumberWorkingCopy(state);
  pushEvent(state, {
    actor: role,
    kind: "structure-delete",
    summary: `Deleted paragraph ${current.number} ${current.title} (${sectionId}) from ${chapterLabel(state, removed.parentId)}.`,
    sectionId,
  });
  return persist(state, mode);
}

export function moveWorkingSection(
  input: { sectionId: string; parentId: string; index: number },
  role: Role,
  mode: WorkspaceMode,
): WorkspaceState {
  const state = ensureStore(mode);
  assertCanEditStructure(state, role);
  const current = state.workingSections[input.sectionId];
  if (!current) throw new Error(`Unknown section ${input.sectionId}`);
  const fromNumber = current.number;
  const moved = moveSectionId(state.workingOutline, input.sectionId, input.parentId, input.index);
  state.workingOutline = moved.outline;
  renumberWorkingCopy(state);
  const updated = state.workingSections[input.sectionId];
  pushEvent(state, {
    actor: role,
    kind: "structure-move",
    summary: `Moved paragraph ${input.sectionId} from ${fromNumber} (${chapterLabel(state, moved.fromParentId)}) to ${updated.number} (${chapterLabel(state, moved.toParentId)}).`,
    sectionId: input.sectionId,
  });
  return persist(state, mode);
}

export function splitWorkingSection(sectionId: string, role: Role, mode: WorkspaceMode): WorkspaceState {
  const state = ensureStore(mode);
  assertCanEditStructure(state, role);
  const source = state.workingSections[sectionId];
  if (!source) throw new Error(`Unknown section ${sectionId}`);
  const sourceBinding = state.assistBindings[sectionId] ?? bindingFromWorking(source);
  const id = `wc-${randomUUID()}`;
  state.workingSections[id] = {
    id,
    number: "",
    title: "New paragraph",
    body: "",
    updatedAt: now(),
    updatedBy: role,
  };
  state.workingOutline = insertSectionId(state.workingOutline, id, sectionId, "after");
  state.assistBindings[sectionId] = sourceBinding;
  state.assistBindings[id] = emptyAssistBinding(id);
  renumberWorkingCopy(state);
  pushEvent(state, {
    actor: role,
    kind: "structure-split",
    summary: `Split ${source.number} ${source.title} (${sectionId}); empty sibling ${state.workingSections[id].number} (${id}) has no Assist chips until text is moved.`,
    sectionId,
  });
  return persist(state, mode);
}

export function renameWorkingSection(sectionId: string, title: string, role: Role, mode: WorkspaceMode): WorkspaceState {
  const state = ensureStore(mode);
  assertCanEditStructure(state, role);
  const current = state.workingSections[sectionId];
  if (!current) throw new Error(`Unknown section ${sectionId}`);
  const nextTitle = title.trim();
  if (!nextTitle) throw new Error("Paragraph title is required.");
  const previous = current.title;
  state.workingSections[sectionId] = {
    ...current,
    title: nextTitle,
    updatedAt: now(),
    updatedBy: role,
  };
  pushEvent(state, {
    actor: role,
    kind: "structure-rename",
    summary: `Renamed paragraph ${current.number} (${sectionId}) from “${previous}” to “${nextTitle}”.`,
    sectionId,
  });
  return persist(state, mode);
}

export function workingOutline(mode: WorkspaceMode): WorkingOutlineChapter[] {
  return ensureStore(mode).workingOutline;
}

export function fallbackSectionId(mode: WorkspaceMode, state: WorkspaceState = ensureStore(mode)): string {
  return firstSectionId(state.workingOutline) ?? "1-1";
}

export function resetTrainingWorkspace(role: Role): WorkspaceState {
  if (role !== "editor" && role !== "approver") {
    throw new ForbiddenError("Only Editors or Approvers may reset the training copy.");
  }
  wipeUploadsDir("training");
  const initial = emptyState("training");
  initial.role = role;
  initial.timeline = [
    {
      id: randomUUID(),
      at: now(),
      actor: role,
      kind: "training-reset",
      summary:
        "Training copy reset to the original regulation. Practice edits, uploads, and the training activity list were cleared. Live workspace was not changed.",
    },
  ];
  return persist(initial, "training");
}

export function publicState(mode: WorkspaceMode) {
  const state = ensureStore(mode);
  const baseline = flattenSections();
  return {
    mode,
    role: state.role,
    locked: state.locked,
    lockedAt: state.lockedAt,
    lockReason: state.lockReason,
    wgReviewReady: state.wgReviewReady,
    wgReviewReadyAt: state.wgReviewReadyAt,
    lastActivityAt: state.lastActivityAt,
    tasks: state.tasks,
    snapshots: state.snapshots.map(({ sections: _sections, outline: _outline, ...rest }) => rest),
    timeline: state.timeline,
    uploads: state.uploads,
    wgReviewMarks: state.wgReviewMarks,
    sergeant: state.sergeant,
    workingSections: state.workingSections,
    workingOutline: state.workingOutline,
    assistBindings: state.assistBindings,
    baselineSections: Object.fromEntries(baseline.map((section) => [section.id, section])),
  };
}
