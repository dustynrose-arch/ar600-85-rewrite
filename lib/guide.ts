export const GUIDE_VIDEO_SRC = "/guide/tutorial.mp4";
export const GUIDE_VIDEO_FILE = "public/guide/tutorial.mp4";

export type GuideAnchor = {
  id: "outline" | "working-copy" | "assist" | "process" | "diff-export" | "roles";
  label: string;
};

export const GUIDE_ANCHORS: GuideAnchor[] = [
  { id: "outline", label: "Step 1 — Open a section" },
  { id: "working-copy", label: "Step 2 — Edit your draft (not the baseline)" },
  { id: "assist", label: "Step 3 — Assist chips" },
  { id: "process", label: "Step 4 — Process map" },
  { id: "diff-export", label: "Step 5 — Diff, snapshot, export" },
  { id: "roles", label: "Step 6 — Roles" },
];
