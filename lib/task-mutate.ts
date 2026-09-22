import type { Role, Task, WorkspaceState } from "./types.ts";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isSuspenseDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month! - 1 && date.getUTCDate() === day;
}

/** Calendar date or null. Empty clears the date. Anything else is rejected. */
export function normalizeSuspense(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (!isSuspenseDate(value)) throw new Error("Suspense must be a calendar date.");
  return value;
}

/** Free-text name or role. Blank means unassigned. */
export function normalizeAssignedTo(value: unknown): string {
  if (value == null) return "";
  if (typeof value !== "string") throw new Error("Assigned to must be text.");
  return value.trim();
}

/** Backfill older drafts so every task has Suspense and Assigned to. */
export function ensureTaskFields(task: Task): boolean {
  let changed = false;
  const suspense = task.suspense as unknown;
  if (suspense === undefined || (suspense !== null && !isSuspenseDate(suspense))) {
    task.suspense = isSuspenseDate(suspense) ? suspense : null;
    changed = true;
  }
  if (typeof task.assignedTo !== "string") {
    task.assignedTo = "";
    changed = true;
  }
  return changed;
}

export type TaskFieldPatch = {
  suspense?: string | null;
  assignedTo?: string;
};

/** Editor-only field edit. Does not touch complete-mark or delete history. */
export function updateTaskFields(state: WorkspaceState, taskId: string, patch: TaskFieldPatch, role: Role): void {
  if (role !== "editor") throw new Error("Only Editors may edit tasks.");
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) throw new Error("Task not found.");
  ensureTaskFields(task);
  if (patch.suspense !== undefined) task.suspense = normalizeSuspense(patch.suspense);
  if (patch.assignedTo !== undefined) task.assignedTo = normalizeAssignedTo(patch.assignedTo);
}

/** Remove a task from the draft. No tombstone, trash list, or deletion event. */
export function hardDeleteTask(state: WorkspaceState, taskId: string, role: Role): void {
  if (role !== "editor") throw new Error("Only Editors may delete tasks.");
  const index = state.tasks.findIndex((item) => item.id === taskId);
  if (index < 0) throw new Error("Task not found.");
  const [removed] = state.tasks.splice(index, 1);
  const created = `Created task: ${removed.title}`;
  const completed = `Completed task: ${removed.title}`;
  state.timeline = state.timeline.filter((event) => event.summary !== created && event.summary !== completed);
}
