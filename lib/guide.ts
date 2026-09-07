export const GUIDE_VIDEO_SRC = "/guide/tutorial.mp4";
export const GUIDE_VIDEO_FILE = "public/guide/tutorial.mp4";

export type GuideStep = {
  id: string;
  title: string;
  body: string;
};

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: "baseline",
    title: "ACTIVE baseline vs working copy",
    body: "The locked ACTIVE AR 600–85 baseline (upper pane) is read-only. Edit only the working copy (lower pane). This app never mutates the baseline.",
  },
  {
    id: "outline",
    title: "Open a chapter or paragraph",
    body: "Use the left outline to expand a chapter, then click a paragraph. Search queries the locked baseline only—not the working copy.",
  },
  {
    id: "edit-save",
    title: "Edit the middle pane — wait for Saved",
    body: "Type in the editable working-copy pane. Status moves Unsaved → Saving → “Saved on server.” Do not leave the paragraph until you see Saved.",
  },
  {
    id: "assist-chips",
    title: "Assist chips",
    body: "Right pane, Assist tab: Sergeant Keep wording vs Insert See cite; Cheech locked glossary terms; Justice cite-don’t-copy (“See AR X”). Do not copy sister-publication text into this book.",
  },
  {
    id: "process",
    title: "Process tab — do not drift",
    body: "Open Process for the ID → rehab map. Keep identification/referral gates distinct (self-referral is not law-enforcement ID). SUDCC / SUD treatment is clinical care; ADAPT is education only—do not mix those terms.",
  },
  {
    id: "versions-export",
    title: "Diff, snapshots, Export Word",
    body: "Versions tab: named snapshots, side-by-side diff vs baseline or a snapshot, and Summarize. Header Export Word (DRAFT) builds a DRAFT-stamped .docx.",
  },
  {
    id: "roles",
    title: "Roles: Editor, Reviewer, Approver",
    body: "Editor edits text, tasks, snapshots, and Sergeant decisions. Reviewer is read-only. Approver cannot edit text; may mark WG-review ready and unlock after an idle lock.",
  },
  {
    id: "draft-rule",
    title: "Hard rule: DRAFT / WORKING COPY",
    body: "Every export and print keeps DRAFT / WORKING COPY marks. v1 has no non-draft print. Army Publishing Directorate publishes the authenticated AR under AR 25–30. This tool is an internal working copy only.",
  },
];
