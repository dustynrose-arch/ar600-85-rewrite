import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { hardDeleteTask } from "./task-mutate.ts";
import type { Task, TimelineEvent, WorkspaceState } from "./types.ts";

function task(partial: Partial<Task> & Pick<Task, "id" | "title">): Task {
  return {
    notes: "",
    sectionId: "1-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    createdBy: "editor",
    completedAt: null,
    completedBy: null,
    ...partial,
  };
}

function state(tasks: Task[], timeline: TimelineEvent[]): WorkspaceState {
  return { tasks, timeline } as WorkspaceState;
}

test("hardDeleteTask removes the task and its create/complete history", () => {
  const open = task({ id: "drop", title: "Drop me" });
  const keep = task({ id: "keep", title: "Keep me", completedAt: "2026-01-02T00:00:00.000Z", completedBy: "editor" });
  const draft = state(
    [open, keep],
    [
      { id: "e1", at: "2026-01-01T00:00:00.000Z", actor: "editor", kind: "task-create", summary: "Created task: Drop me" },
      { id: "e2", at: "2026-01-02T00:00:00.000Z", actor: "editor", kind: "task-complete", summary: "Completed task: Keep me" },
      { id: "e3", at: "2026-01-01T00:00:01.000Z", actor: "editor", kind: "edit", summary: "Autosaved 1-1." },
    ],
  );

  hardDeleteTask(draft, "drop", "editor");
  assert.deepEqual(draft.tasks.map((item) => item.id), ["keep"]);
  assert.equal(draft.timeline.some((event) => event.summary.includes("Drop me")), false);
  assert.equal(draft.timeline.some((event) => event.kind === "task-delete"), false);
  assert.equal("deletedTasks" in draft, false);
  assert.ok(draft.timeline.some((event) => event.summary === "Completed task: Keep me"));
  assert.ok(draft.timeline.some((event) => event.kind === "edit"));

  hardDeleteTask(draft, "keep", "editor");
  assert.equal(draft.tasks.length, 0);
  assert.equal(draft.timeline.some((event) => event.summary.includes("Keep me")), false);
  assert.ok(draft.timeline.some((event) => event.kind === "edit"));
});

test("hardDeleteTask rejects missing tasks and non-editors without changing the list", () => {
  const keep = task({ id: "keep", title: "Keep me" });
  const draft = state([keep], []);
  assert.throws(() => hardDeleteTask(draft, "missing", "editor"), /Task not found/);
  assert.throws(() => hardDeleteTask(draft, "keep", "reviewer"), /Only Editors may delete tasks/);
  assert.deepEqual(draft.tasks.map((item) => item.id), ["keep"]);
});

test("tasks route persists delete through the draft store, and complete stays", () => {
  const route = readFileSync(new URL("../app/api/tasks/route.ts", import.meta.url), "utf8");
  const store = readFileSync(new URL("./store.ts", import.meta.url), "utf8");
  const assist = readFileSync(new URL("../components/AssistPane.tsx", import.meta.url), "utf8");
  const workbench = readFileSync(new URL("../components/Workbench.tsx", import.meta.url), "utf8");
  assert.match(store, /export async function deleteTask/);
  assert.match(store, /hardDeleteTask\(state, taskId, role\)/);
  assert.match(store, /return withLockedState\(mode, \(state\) => \{\s*hardDeleteTask/);
  assert.match(route, /deleteTask/);
  assert.match(route, /action === "delete" && body\.taskId/);
  assert.match(route, /await deleteTask\(body\.taskId, body\.role, mode\)/);
  assert.match(route, /return NextResponse\.json\(await publicState\(mode\)\)/);
  assert.match(assist, /onDeleteTask\(task\.id\)/);
  assert.match(assist, />\s*Delete\s*</);
  assert.match(assist, /onCompleteTask\(task\.id\)/);
  assert.match(workbench, /action: "delete"/);
  assert.match(workbench, /action: "complete"/);
});
