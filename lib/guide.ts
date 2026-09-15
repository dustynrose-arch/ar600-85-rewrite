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
  id: string;
  label: string;
};

export const GUIDE_ANCHORS: GuideAnchor[] = [
  { id: "0-purpose", label: "0. Purpose" },
  { id: "working-group-access-password-gate", label: "Working-group access" },
  { id: "part-a-orient-the-workspace", label: "Part A — Orient" },
  { id: "part-b-edit-your-draft", label: "Part B — Edit" },
  { id: "part-c-see-what-changed", label: "Part C — Compare" },
  { id: "part-d-writing-assistant-only-when-warranted", label: "Part D — Writing Assistant" },
  { id: "part-e-document-crossmatch", label: "Part E — Crossmatch" },
  { id: "part-f-practice-safely", label: "Part F — Training" },
  { id: "part-g-hand-off-export", label: "Part G — Export" },
  { id: "part-h-roles-gates-and-session-safety", label: "Part H — Roles" },
  { id: "20-first-session-quick-path", label: "20. First-session path" },
  { id: "21-quick-reference", label: "21. Quick reference" },
];
