"use client";

import { useEffect, useState } from "react";
import { PaneToggle } from "@/components/PaneToggle";
import { chapterDisplayLabel } from "@/lib/outline";
import { canEditStructure } from "@/lib/roles";
import { SUMMARY_VIEW_ID } from "@/lib/summary-of-change";
import type { Role, SearchHit, StructurePosition, WorkingOutlineChapter, WorkingSection } from "@/lib/types";

type DialogMode = "add" | "rename" | "delete" | null;

type MenuState = {
  x: number;
  y: number;
  targetId: string;
  kind: "chapter" | "section";
};

type Props = {
  outline: WorkingOutlineChapter[];
  sections: Record<string, WorkingSection>;
  selectedId: string;
  onSelect: (id: string) => void;
  query: string;
  onQuery: (value: string) => void;
  hits: SearchHit[];
  searching: boolean;
  changedIds: Set<string>;
  markedIds: Set<string>;
  changeCount: number;
  onCollapse: () => void;
  role: Role;
  locked: boolean;
  onAdd: (targetId: string, position: StructurePosition, title: string) => Promise<string | undefined>;
  onDelete: (nodeId: string) => Promise<void>;
  onRename: (nodeId: string, title: string) => Promise<void>;
  onMove: (nodeId: string, parentId: string, index: number) => Promise<void>;
  onSplit: (nodeId: string) => Promise<string | undefined>;
};

export function OutlinePane({
  outline,
  sections,
  selectedId,
  onSelect,
  query,
  onQuery,
  hits,
  searching,
  changedIds,
  markedIds,
  changeCount,
  onCollapse,
  role,
  locked,
  onAdd,
  onDelete,
  onRename,
  onMove,
  onSplit,
}: Props) {
  const editable = canEditStructure(role, locked);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [dialogTarget, setDialogTarget] = useState<string>("");
  const [dialogPosition, setDialogPosition] = useState<StructurePosition>("after");
  const [dialogTitle, setDialogTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropHint, setDropHint] = useState<string | null>(null);

  const selected = sections[selectedId];

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menu]);

  const openAdd = (targetId: string, position: StructurePosition) => {
    setMenu(null);
    setDialogTarget(targetId);
    setDialogPosition(position);
    setDialogTitle("New paragraph");
    setDialogError(null);
    setDialog("add");
  };

  const openRename = (sectionId: string) => {
    setMenu(null);
    setDialogTarget(sectionId);
    setDialogTitle(sections[sectionId]?.title ?? "");
    setDialogError(null);
    setDialog("rename");
  };

  const openDelete = (sectionId: string) => {
    setMenu(null);
    setDialogTarget(sectionId);
    setDialogError(null);
    setDialog("delete");
  };

  const submitDialog = async () => {
    if (busy) return;
    setBusy(true);
    setDialogError(null);
    try {
      if (dialog === "add") {
        const createdId = await onAdd(dialogTarget, dialogPosition, dialogTitle);
        if (createdId) onSelect(createdId);
      } else if (dialog === "rename") {
        await onRename(dialogTarget, dialogTitle);
      } else if (dialog === "delete") {
        await onDelete(dialogTarget);
      }
      setDialog(null);
    } catch (error) {
      setDialogError(error instanceof Error ? error.message : "Structure edit failed");
    } finally {
      setBusy(false);
    }
  };

  const onDropSection = async (targetSectionId: string, before: boolean) => {
    if (!dragId || dragId === targetSectionId) return;
    const chapter = outline.find((item) => item.sectionIds.includes(targetSectionId));
    if (!chapter) return;
    let index = chapter.sectionIds.indexOf(targetSectionId);
    if (!before) index += 1;
    try {
      await onMove(dragId, chapter.id, index);
    } catch {
      /* drop rejected (role/lock) */
    }
    setDragId(null);
    setDropHint(null);
  };

  const onDropChapter = async (chapterId: string) => {
    if (!dragId) return;
    const chapter = outline.find((item) => item.id === chapterId);
    if (!chapter) return;
    try {
      await onMove(dragId, chapter.id, chapter.sectionIds.length);
    } catch {
      /* drop rejected (role/lock) */
    }
    setDragId(null);
    setDropHint(null);
  };

  return (
    <aside className="flex flex-col min-h-0 h-full border-r border-army-black/15 bg-[#efe8d8]">
      <div className="p-3 border-b border-army-black/10">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-[10px] font-bold tracking-[0.16em] text-army-slate">OUTLINE</p>
          <PaneToggle label="outline" expanded onClick={onCollapse} />
        </div>
        <label className="text-[10px] font-bold tracking-[0.16em] text-army-slate block mb-1">
          SEARCH ORIGINAL REGULATION
        </label>
        <div className="relative">
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search AR 600-85"
            aria-label="Search original regulation"
            className="w-full border border-army-black/20 bg-army-paper px-2 py-1.5 pr-8 text-sm"
          />
          {query.trim() ? (
            <button
              type="button"
              aria-label="Clear search"
              title="Clear search"
              onClick={() => onQuery("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-base leading-none text-army-slate hover:text-army-ink"
            >
              ×
            </button>
          ) : null}
        </div>
        {searching ? <p className="text-[11px] text-army-slate mt-1">Searching…</p> : null}
        {editable && !query.trim() ? (
          <div className="mt-2 space-y-1">
            <p className="text-[10px] text-army-slate">
              Working-copy structure. Display numbers follow AR 25–30 / DA Pam 25–40. The original regulation is
              unchanged.
            </p>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                disabled={!selected}
                onClick={() => selected && openAdd(selected.id, "before")}
                className="text-[10px] px-1.5 py-0.5 bg-white border border-army-black/15 disabled:opacity-40"
              >
                Add before
              </button>
              <button
                type="button"
                disabled={!selected}
                onClick={() => selected && openAdd(selected.id, "after")}
                className="text-[10px] px-1.5 py-0.5 bg-white border border-army-black/15 disabled:opacity-40"
              >
                Add after
              </button>
              <button
                type="button"
                disabled={!selected || busy}
                onClick={() => selected && void onSplit(selected.id)}
                className="text-[10px] px-1.5 py-0.5 bg-white border border-army-black/15 disabled:opacity-40"
              >
                Split
              </button>
              <button
                type="button"
                disabled={!selected}
                onClick={() => selected && openRename(selected.id)}
                className="text-[10px] px-1.5 py-0.5 bg-white border border-army-black/15 disabled:opacity-40"
              >
                Rename
              </button>
              <button
                type="button"
                disabled={!selected}
                onClick={() => selected && openDelete(selected.id)}
                className="text-[10px] px-1.5 py-0.5 bg-white border border-army-rust/40 text-army-rust disabled:opacity-40"
              >
                Delete
              </button>
            </div>
          </div>
        ) : null}
        {!editable && !query.trim() ? (
          <p className="text-[10px] text-army-slate mt-2">
            Structure edits are Editor-only. Reviewer and Approver can browse the working-copy outline.
          </p>
        ) : null}
      </div>
      <div className="pane-scroll overflow-y-auto flex-1 min-h-0">
        {query.trim() ? (
          <ul className="p-2 space-y-2">
            {hits.length === 0 && !searching ? (
              <li className="text-xs text-army-slate px-1">No matching sections.</li>
            ) : null}
            {hits.map((hit) => (
              <li key={hit.sectionId}>
                <button
                  type="button"
                  onClick={() => onSelect(hit.sectionId)}
                  className={`w-full text-left px-2 py-1.5 text-xs border ${
                    selectedId === hit.sectionId ? "bg-army-gold/30 border-army-gold" : "bg-army-paper/80 border-transparent"
                  }`}
                >
                  <div className="font-semibold">
                    {hit.number} {hit.title}
                  </div>
                  <div className="text-[10px] text-army-slate">{hit.chapterLabel}</div>
                  <div className="mt-1 text-army-ink/80">{hit.snippet}</div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <nav className="py-2">
            <div className="px-2 mb-2">
              <button
                type="button"
                onClick={() => onSelect(SUMMARY_VIEW_ID)}
                className={`w-full text-left px-2 py-2 text-[12px] leading-snug border ${
                  selectedId === SUMMARY_VIEW_ID
                    ? "bg-army-gold/35 font-semibold border-army-gold"
                    : "bg-army-paper/90 border-army-black/10 hover:bg-army-gold/15"
                }`}
              >
                <span className="block text-[10px] font-bold tracking-[0.16em] text-army-goldDark">
                  FRONT MATTER
                </span>
                Summary of Change
                <span className="ml-1 text-[10px] text-army-rust font-bold">DRAFT</span>
                <span className="block text-[10px] text-army-slate font-normal mt-0.5">
                  {changeCount === 0
                    ? "No deltas yet — original vs your draft"
                    : `${changeCount} delta${changeCount === 1 ? "" : "s"} — original vs your draft`}
                </span>
              </button>
            </div>
            {outline.map((chapter) => {
              const label = chapterDisplayLabel(chapter, outline);
              const open = chapter.id === "1" || chapter.id === "7" || chapter.id === "10" || chapter.sectionIds.includes(selectedId);
              return (
                <details
                  key={chapter.id}
                  open={open}
                  className={`px-2 ${dropHint === `chapter:${chapter.id}` ? "bg-army-gold/20" : ""}`}
                  onDragOver={(event) => {
                    if (!editable || !dragId) return;
                    event.preventDefault();
                    setDropHint(`chapter:${chapter.id}`);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    void onDropChapter(chapter.id);
                  }}
                >
                  <summary
                    className="cursor-pointer text-[11px] font-bold tracking-wide text-army-oliveDark py-1"
                    onContextMenu={(event) => {
                      if (!editable) return;
                      event.preventDefault();
                      setMenu({ x: event.clientX, y: event.clientY, targetId: chapter.id, kind: "chapter" });
                    }}
                  >
                    <span>
                      {label}. {chapter.title}
                    </span>
                  </summary>
                  <ul className="mb-2">
                    {chapter.sectionIds.map((sectionId) => {
                      const section = sections[sectionId];
                      if (!section) return null;
                      const changed = changedIds.has(section.id);
                      const marked = markedIds.has(section.id);
                      return (
                        <li
                          key={section.id}
                          onDragOver={(event) => {
                            if (!editable || !dragId) return;
                            event.preventDefault();
                            const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
                            const before = event.clientY < rect.top + rect.height / 2;
                            setDropHint(`${before ? "before" : "after"}:${section.id}`);
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
                            void onDropSection(section.id, event.clientY < rect.top + rect.height / 2);
                          }}
                          className={
                            dropHint === `before:${section.id}`
                              ? "border-t-2 border-army-gold"
                              : dropHint === `after:${section.id}`
                                ? "border-b-2 border-army-gold"
                                : ""
                          }
                        >
                          <div className="flex items-stretch">
                            {editable ? (
                              <button
                                type="button"
                                draggable
                                title="Drag to reorder"
                                aria-label={`Drag ${section.number}`}
                                onDragStart={() => setDragId(section.id)}
                                onDragEnd={() => {
                                  setDragId(null);
                                  setDropHint(null);
                                }}
                                className="px-1 text-[10px] text-army-slate cursor-grab"
                              >
                                ::
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => onSelect(section.id)}
                              onContextMenu={(event) => {
                                if (!editable) return;
                                event.preventDefault();
                                setMenu({
                                  x: event.clientX,
                                  y: event.clientY,
                                  targetId: section.id,
                                  kind: "section",
                                });
                              }}
                              className={`flex-1 text-left px-2 py-1 text-[12px] leading-snug ${
                                selectedId === section.id ? "bg-army-gold/35 font-semibold" : "hover:bg-army-gold/15"
                              }`}
                            >
                              <span className="text-army-goldDark mr-1">{section.number}</span>
                              {section.title}
                              {changed ? <span className="ml-1 text-[10px] text-army-rust">●</span> : null}
                              {marked ? <span className="ml-1 text-[10px] text-army-olive">WG</span> : null}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              );
            })}
          </nav>
        )}
      </div>
      {menu && editable ? (
        <div
          className="fixed z-40 min-w-[10rem] bg-white border border-army-black/20 shadow-lg text-[12px]"
          style={{ left: menu.x, top: menu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          {menu.kind === "section" ? (
            <>
              <button type="button" className="block w-full text-left px-3 py-1.5 hover:bg-army-gold/20" onClick={() => openAdd(menu.targetId, "before")}>
                Add before
              </button>
              <button type="button" className="block w-full text-left px-3 py-1.5 hover:bg-army-gold/20" onClick={() => openAdd(menu.targetId, "after")}>
                Add after
              </button>
              <button
                type="button"
                className="block w-full text-left px-3 py-1.5 hover:bg-army-gold/20"
                onClick={() => {
                  setMenu(null);
                  void onSplit(menu.targetId);
                }}
              >
                Split after
              </button>
              <button type="button" className="block w-full text-left px-3 py-1.5 hover:bg-army-gold/20" onClick={() => openRename(menu.targetId)}>
                Rename title
              </button>
              <button type="button" className="block w-full text-left px-3 py-1.5 hover:bg-army-rust/10 text-army-rust" onClick={() => openDelete(menu.targetId)}>
                Delete…
              </button>
            </>
          ) : (
            <>
              <button type="button" className="block w-full text-left px-3 py-1.5 hover:bg-army-gold/20" onClick={() => openAdd(menu.targetId, "before")}>
                Add before
              </button>
              <button type="button" className="block w-full text-left px-3 py-1.5 hover:bg-army-gold/20" onClick={() => openAdd(menu.targetId, "after")}>
                Add after
              </button>
            </>
          )}
        </div>
      ) : null}
      {dialog ? (
        <div className="fixed inset-0 z-50 bg-army-black/40 flex items-center justify-center p-4">
          <div className="bg-army-paper border border-army-black/20 w-full max-w-sm p-4 space-y-3">
            <h2 className="font-semibold text-sm">
              {dialog === "add" ? "Add working-copy paragraph" : dialog === "rename" ? "Rename paragraph title" : "Delete paragraph"}
            </h2>
            {dialog === "delete" ? (
              <p className="text-sm">
                Delete <strong>{sections[dialogTarget]?.number} {sections[dialogTarget]?.title}</strong> from the
                working copy? Assist reminders for this paragraph are dropped with it. The original regulation
                is unchanged. Remaining chips stay on their stable ids.
              </p>
            ) : (
              <label className="block text-xs">
                Title
                <input
                  value={dialogTitle}
                  onChange={(event) => setDialogTitle(event.target.value)}
                  className="mt-1 w-full border border-army-black/20 px-2 py-1.5 text-sm"
                  autoFocus
                />
              </label>
            )}
            {dialogError ? <p className="text-xs text-army-rust">{dialogError}</p> : null}
            <div className="flex justify-end gap-2">
              <button type="button" className="px-2 py-1 text-xs border" onClick={() => setDialog(null)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || (dialog !== "delete" && !dialogTitle.trim())}
                className={`px-2 py-1 text-xs font-semibold ${dialog === "delete" ? "bg-army-rust text-white" : "bg-army-olive text-army-cream"}`}
                onClick={() => void submitDialog()}
              >
                {dialog === "delete" ? "Delete" : dialog === "rename" ? "Rename" : "Add"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
