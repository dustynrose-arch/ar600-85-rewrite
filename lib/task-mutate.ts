import type { Role, WorkspaceState } from "./types.ts";

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
