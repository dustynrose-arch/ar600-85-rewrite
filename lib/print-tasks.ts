import { isSuspenseDate } from "./task-mutate.ts";

/** Build a clean printable HTML document for the full Tasks list (open + complete). */

export type PrintableTask = {
  id: string;
  title: string;
  notes: string;
  sectionId: string | null;
  suspense: string | null;
  assignedTo: string;
  completedAt: string | null;
};

export type PrintableSection = {
  number: string;
  title: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function taskSectionLabel(
  task: PrintableTask,
  sections: Record<string, PrintableSection> | undefined,
): string {
  if (!task.sectionId) return "no section";
  const section = sections?.[task.sectionId];
  if (!section) return task.sectionId;
  return `${section.number} ${section.title}`.trim();
}

export function taskStatusLabel(task: PrintableTask): string {
  return task.completedAt ? "complete" : "open";
}

const SUSPENSE_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Army-style calendar date for print, or an em dash when unset. */
export function formatSuspenseForPrint(value: string | null | undefined): string {
  if (!isSuspenseDate(value)) return "—";
  const month = SUSPENSE_MONTHS[Number(value.slice(5, 7)) - 1];
  const day = Number(value.slice(8, 10));
  return `${day} ${month} ${value.slice(0, 4)}`;
}

export function formatAssignedForPrint(value: string | null | undefined): string {
  const text = (value ?? "").trim();
  return text || "—";
}

/** Readable print document matching the Tasks tab fields the user already sees. */
export function buildTasksPrintHtml(
  tasks: PrintableTask[],
  sections: Record<string, PrintableSection> | undefined,
  printedAt: string = new Date().toLocaleString(),
): string {
  const rows =
    tasks.length === 0
      ? `<tr><td colspan="6">No tasks.</td></tr>`
      : tasks
          .map((task) => {
            const title = escapeHtml(task.title || "(untitled)");
            const notes = escapeHtml(task.notes || "");
            const suspense = escapeHtml(formatSuspenseForPrint(task.suspense));
            const assigned = escapeHtml(formatAssignedForPrint(task.assignedTo));
            const section = escapeHtml(taskSectionLabel(task, sections));
            const status = escapeHtml(taskStatusLabel(task));
            return `<tr>
  <td>${title}</td>
  <td>${notes}</td>
  <td>${suspense}</td>
  <td>${assigned}</td>
  <td>${section}</td>
  <td>${status}</td>
</tr>`;
          })
          .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>AR 600-85 Revision — Task list</title>
<style>
  @page { margin: 0.75in; }
  body { font: 12pt/1.4 Georgia, "Times New Roman", serif; color: #111; }
  h1 { font-size: 16pt; margin: 0 0 0.25rem; }
  .meta { font-size: 10pt; color: #444; margin: 0 0 1rem; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #333; padding: 0.4rem 0.5rem; vertical-align: top; text-align: left; }
  th { background: #eee; font-size: 10pt; text-transform: uppercase; letter-spacing: 0.04em; }
  td { font-size: 11pt; white-space: pre-wrap; word-break: break-word; }
</style>
</head>
<body>
  <h1>AR 600-85 Revision — Task list</h1>
  <p class="meta">Printed ${escapeHtml(printedAt)} · ${tasks.length} task${tasks.length === 1 ? "" : "s"} (open and complete)</p>
  <table>
    <thead>
      <tr><th>Title</th><th>Notes</th><th>Suspense</th><th>Assigned to</th><th>Section</th><th>Status</th></tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
</body>
</html>`;
}

/** Open a clean print view and invoke the browser print dialog. */
export function printTaskList(
  tasks: PrintableTask[],
  sections: Record<string, PrintableSection> | undefined,
): void {
  const html = buildTasksPrintHtml(tasks, sections);
  const frame = document.createElement("iframe");
  frame.setAttribute("title", "Print task list");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  const win = frame.contentWindow;
  if (!win) {
    frame.remove();
    return;
  }
  const cleanup = () => {
    frame.remove();
  };
  win.addEventListener("afterprint", cleanup);
  // Fallback if afterprint never fires (some browsers).
  window.setTimeout(cleanup, 60_000);
  win.focus();
  win.print();
}
