# AR 600-85 Rewrite — Working Copy

Browser-only Next.js application for the internal Army Deputy Chief of Staff, G–1 rewrite working group. Editors maintain a **working copy** of AR 600–85 against a **read-only embedded baseline**. The baseline is never mutated.

This is the WP1–WP7 build: three-pane chrome with collapsible outline and Assist panes, automatic save, roles and gates, Assist reminders (glossary, Limited Use Policy (self-referral) vs legal / adverse-action hints, overlap checks), process map, cite-don’t-copy authority, checkpoints, stacked compare (original regulation above your draft), Word export, audited uploads, Editor-only working-copy structure edits, and an in-app User Guide with a First session walkthrough plus video placeholder.

**Not an official publication.** Word exports (header, footer, and title page) are always marked **DRAFT / WORKING COPY**. The header shows a thin **DRAFT / WORKING COPY** chip (not a fat banner). G–1 seal on the left; Army emblem is an empty sized slot until an official `public/army-emblem.png` is supplied.

## Baseline

ACTIVE AR 600-85 (4 Oct 2024, admin revs 27 Feb 2025 / 19 Feb 2026)

Seeded structure: Chapters 1–18 and Appendices A–G at paragraph level (about 298 sections), plus glossary terms and the identification-to-rehabilitation process map. Official paragraph numbers and titles are preserved. Body text is official-style structured working-copy language for search and rewrite—not a substitute for the authenticated PDF on Army Publishing Directorate.

## Requirements

- Node.js 20+ (22 is fine)
- npm

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Next.js uses port **3000** by default. If that port is busy, the CLI will offer the next free port (3001, …).

Production-style:

```bash
npm run build
npm start
```

`npm start` also serves on port **3000**.

## What the app does

| Area | Behavior |
| --- | --- |
| Chrome | Outline \| editor \| Assist/authority. Official G–1 seal at `public/g1-seal.png`. Title *AR 600-85 Rewrite — Working Copy*. Subtitle *Internal G-1 rewrite working group use only*. Outline and Assist collapse so the center editor can widen; the tab remembers that choice for the session. |
| Editing | Section edit with automatic save plus an Editor-only **Save** button (timeline: “Manual save”). The original regulation pane is read-only. Your draft has Undo (button and Ctrl+Z / ⌘Z) and browser spellcheck; the original regulation pane is not spellchecked. Hide outline / Hide Assist live on those side panes only — not in the center chrome. |
| Structure | Editors only (Reviewer/Approver get 403). Add before/after, split, delete (confirm), rename title, drag-reorder including across chapters. Outline stays chapter → numbered paragraph; nested markers (4-2a, 4-2a(1)) stay in the paragraph body. Stable node ids stay put; display numbers renumber IAW AR 25-30 / DA Pam 25-40. Every add/delete/move/rename/split is audited. ACTIVE baseline seed is never written. Assist chips, Process highlight, tasks, drafts, and snapshots keep the stable id. Split leaves chips on the source; delete drops assist state for that id. |
| Search | Queries the original regulation (read-only) only. Selecting a result scrolls that section and highlights matches in the open body (original + draft). Clear (×) removes the query, results, and highlights. |
| Versions | Named snapshots. Compare original regulation (above) vs your draft (below), or vs a checkpoint. **List the changes** builds bullets from those diffs. |
| Summary of Change | Outline front-matter plus Assist **Summary** tab. Auto-built Revises / Adds / Rescinds / Moves rows from original regulation (read-only) versus your draft, with APD cites (`para 1–1`, `para 1–4a(1)`). Structure and title changes are flagged; body keystrokes still produce wording rows only. Dedicated Word export stays marked DRAFT. |
| Tasks | Editors create and complete tasks. |
| Roles | Editor (edit / tasks / snapshots). Reviewer (read-only). Approver (WG-review marks; can unlock). |
| Idle | Warn at 14 minutes. At 15 minutes: save current section and lock. |
| Export | Word `.docx` always DRAFT-stamped (header, footer, title-page disclaimer citing AR 25-30 / DA Pam 25-40). Full working-copy export includes the Summary of Change table. Dedicated Summary export uses the title *Summary of Change (DRAFT — working copy; not authenticated under AR 25-30 / DA Pam 25-40)* with columns Action \| Location \| Original (ACTIVE) \| Revised (your draft). |
| Upload / compare | Editors and Approvers upload `.docx`, `.pdf`, or `.pptx` (25 MB). Old `.doc` / `.ppt` are rejected with a toast. Activity log stores who, when, filename, size, and SHA-256. Compare lists suggestion-only Match / Miss / Unclear rows against your draft (source + page/slide → location → draft excerpt → document excerpt → verdict). Nothing is auto-written into your draft or the original regulation. |
| Assist | Glossary locked-term reminders; legal chips split as **Limited Use Policy (self-referral)** vs **Legal / adverse-action hint** (testing bases, process path, rights / Art. 31, civilian path) + AR 600-8-2 / 635-200 / 135-175 / 135-178 cites; 22 overlap checks (Keep wording \| Insert See cite). Chips and Process-step highlight bind to the working-copy stable id only — never display numbers and never the ACTIVE baseline. |
| Process | ID → rehab map with branch labels. |
| Authority | Cite-don’t-copy hot list and sister publications. |
| Guide | In-app User Guide at `/guide`: First session walkthrough (anchors: outline, working-copy, assist, process, diff-export, roles), Assist help written for G–1 editors, and a video slot (`public/guide/tutorial.mp4` when present; otherwise “Tutorial video coming soon”). |

Working-copy state lives in `data/runtime/` (created at first run, not committed). Uploads go to `data/uploads/`.

## Project layout

```
app/            App Router pages and API routes
components/     Three-pane chrome and Assist tabs
lib/            Store, diff, export, roles, seed data
public/         Official G-1 seal; optional guide video at public/guide/
scripts/        Baseline seed generator
```
