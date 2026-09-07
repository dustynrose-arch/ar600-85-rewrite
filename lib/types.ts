export type Role = "editor" | "reviewer" | "approver";

export type Section = {
  id: string;
  number: string;
  title: string;
  body: string;
};

export type Chapter = {
  id: string;
  label: string;
  title: string;
  sections: Section[];
};

export type BaselineDocument = {
  publication: string;
  longTitle: string;
  baselineLabel: string;
  effectiveDate: string;
  adminRevisions: string[];
  proponent: string;
  chapters: Chapter[];
};

export type WorkingSection = Section & {
  updatedAt: string;
  updatedBy: Role;
};

export type TaskStatus = "open" | "complete";

export type Task = {
  id: string;
  title: string;
  notes: string;
  sectionId: string | null;
  createdAt: string;
  createdBy: Role;
  completedAt: string | null;
  completedBy: Role | null;
};

export type Snapshot = {
  id: string;
  label: string;
  createdAt: string;
  createdBy: Role;
  sections: Record<string, WorkingSection>;
};

export type TimelineEvent = {
  id: string;
  at: string;
  actor: Role;
  kind: string;
  summary: string;
  sectionId?: string;
};

export type UploadAudit = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  uploadedAt: string;
  uploadedBy: Role;
};

export type WgReviewMark = {
  sectionId: string;
  markedAt: string;
  markedBy: Role;
};

export type SergeantDecision = "keep" | "see-cite";

export type SergeantLaneState = {
  laneId: string;
  decision: SergeantDecision | null;
  citeTo?: string;
  decidedAt?: string;
};

export type WorkspaceState = {
  role: Role;
  locked: boolean;
  lockedAt: string | null;
  lockReason: string | null;
  wgReviewReady: boolean;
  wgReviewReadyAt: string | null;
  lastActivityAt: string;
  workingSections: Record<string, WorkingSection>;
  tasks: Task[];
  snapshots: Snapshot[];
  timeline: TimelineEvent[];
  uploads: UploadAudit[];
  wgReviewMarks: WgReviewMark[];
  sergeant: SergeantLaneState[];
};

export type DiffHunk = {
  sectionId: string;
  number: string;
  title: string;
  baseline: string;
  current: string;
  added: string[];
  removed: string[];
  unchanged: boolean;
};

export type SearchHit = {
  sectionId: string;
  number: string;
  chapterLabel: string;
  title: string;
  snippet: string;
};

export const IDLE_WARN_MS = 14 * 60 * 1000;
export const IDLE_LOCK_MS = 15 * 60 * 1000;
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const BASELINE_LABEL =
  "ACTIVE AR 600-85 (4 Oct 2024, admin revs 27 Feb 2025 / 19 Feb 2026)";
