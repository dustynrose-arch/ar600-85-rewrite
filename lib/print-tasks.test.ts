import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  buildTasksPrintHtml,
  taskSectionLabel,
  taskStatusLabel,
  type PrintableTask,
} from "./print-tasks.ts";

function readRepoFile(relativePath: string): string {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

const sampleTasks: PrintableTask[] = [
  {
    id: "t1",
    title: "Tighten purpose",
    notes: "Keep ASAP wording",
    sectionId: "1-1",
    suspense: "2026-10-15",
    assignedTo: "S-1 NCO",
    completedAt: null,
  },
  {
    id: "t2",
    title: "Done item",
    notes: "",
    sectionId: null,
    suspense: null,
    assignedTo: "",
    completedAt: "2026-01-01T00:00:00.000Z",
  },
];

const sections = {
  "1-1": { number: "1-1", title: "Purpose" },
};

test("print HTML includes every task title, status, section, notes, suspense, and assigned to", () => {
  const html = buildTasksPrintHtml(sampleTasks, sections, "9/22/2026, 1:00:00 PM");
  assert.match(html, /<th>Suspense<\/th><th>Assigned to<\/th>/);
  assert.match(html, /Tighten purpose/);
  assert.match(html, /Keep ASAP wording/);
  assert.match(html, /15 Oct 2026/);
  assert.match(html, /S-1 NCO/);
  assert.match(html, /1-1 Purpose/);
  assert.match(html, />open</);
  assert.match(html, /Done item/);
  assert.match(html, /no section/);
  assert.match(html, />complete</);
  assert.match(html, /<td>—<\/td>\s*<td>—<\/td>/);
  assert.match(html, /2 tasks \(open and complete\)/);
  assert.match(html, /Printed 9\/22\/2026/);
  assert.equal(html.includes("<script"), false);
});

test("print HTML escapes untrusted task text", () => {
  const html = buildTasksPrintHtml(
    [
      {
        id: "x",
        title: '<img src=x onerror="alert(1)">',
        notes: "a & b <c>",
        sectionId: null,
        suspense: "2026-03-01",
        assignedTo: 'A & B <script>',
        completedAt: null,
      },
    ],
    undefined,
  );
  assert.equal(html.includes("<img"), false);
  assert.equal(html.includes("<script>"), false);
  assert.match(html, /&lt;img src=x/);
  assert.match(html, /a &amp; b &lt;c&gt;/);
  assert.match(html, /1 Mar 2026/);
  assert.match(html, /A &amp; B &lt;script&gt;/);
});

test("empty task list still prints a readable stub", () => {
  const html = buildTasksPrintHtml([], undefined);
  assert.match(html, /No tasks\./);
  assert.match(html, /0 tasks \(open and complete\)/);
});

test("task helpers match Tasks tab status and section labels", () => {
  assert.equal(taskStatusLabel(sampleTasks[0]!), "open");
  assert.equal(taskStatusLabel(sampleTasks[1]!), "complete");
  assert.equal(taskSectionLabel(sampleTasks[0]!, sections), "1-1 Purpose");
  assert.equal(taskSectionLabel(sampleTasks[1]!, sections), "no section");
});

test("Tasks tab exposes Print task list and keeps Complete / Delete", () => {
  const assist = readRepoFile("components/AssistPane.tsx");
  const printLib = readRepoFile("lib/print-tasks.ts");
  assert.match(assist, /printTaskList/);
  assert.match(assist, /Print task list/);
  assert.match(assist, /aria-label="Print entire task list"/);
  assert.match(assist, />\s*Complete\s*</);
  assert.match(assist, />\s*Delete\s*</);
  assert.match(assist, /onCompleteTask/);
  assert.match(assist, /onDeleteTask/);
  assert.match(assist, /type="date"/);
  assert.match(assist, /aria-label="Suspense date"/);
  assert.match(assist, /Assigned to/);
  assert.match(assist, /Suspense is the Army due date/);
  assert.match(printLib, /\.print\(/);
  assert.match(printLib, /buildTasksPrintHtml/);
  assert.match(printLib, /open and complete/);
  assert.match(printLib, /Suspense/);
  assert.match(printLib, /Assigned to/);
});
