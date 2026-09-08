export const GUIDE_VIDEO_SRC = "/guide/tutorial.mp4";
export const GUIDE_VIDEO_FILE = "public/guide/tutorial.mp4";

export type GuideClip = {
  id: string;
  src: string;
  label: string;
};

export const GUIDE_CLIPS: GuideClip[] = [
  { id: "layout", src: "/guide/01-layout.mp4", label: "Layout" },
  { id: "find-and-edit", src: "/guide/02-find-and-edit.mp4", label: "Find & edit" },
  { id: "help-while-writing", src: "/guide/03-help-while-writing.mp4", label: "Help while writing" },
  { id: "compare-and-export", src: "/guide/04-compare-and-export.mp4", label: "Compare & export" },
];

export type GuideAnchor = {
  id: "outline" | "working-copy" | "assist" | "process" | "diff-export" | "roles";
  label: string;
};

export const GUIDE_ANCHORS: GuideAnchor[] = [
  { id: "outline", label: "Step 1 — Open a section" },
  { id: "working-copy", label: "Step 2 — Edit your draft (not the original regulation)" },
  { id: "assist", label: "Step 3 — Use Assist reminders on the right" },
  { id: "process", label: "Step 4 — Peek at the Process map" },
  { id: "diff-export", label: "Step 5 — Compare, checkpoint, export" },
  { id: "roles", label: "Step 6 — Know your role" },
];
