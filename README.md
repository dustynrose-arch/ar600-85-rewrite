# AR 600-85 Rewrite — Working Copy

Browser-only Next.js application for the internal Army Deputy Chief of Staff, G–1 rewrite working group. Editors maintain a **working copy** of AR 600–85 against a **read-only embedded baseline**. The baseline is never mutated. Drafts save on the server (`data/runtime/`), not in `localStorage`.

This is the accepted WP1–WP5 working-copy editor, plus later WP6/WP7 working-group additions already on this repo: collapsible panes, User Guide walkthrough, Summary of Change, and document compare.

**Not an official publication.** The gold-and-black banner always reads:

`DRAFT / WORKING COPY — NOT AN OFFICIAL ARMY PUBLICATION`

Word header, footer, and title page stay DRAFT-stamped.

## Clone and run (Windows or any desktop)

```bash
git clone https://github.com/dustynrose-arch/ar600-85-rewrite.git
cd ar600-85-rewrite
npm install
npm run dev
```

Open [http://localhost:43185](http://localhost:43185).

- Node.js 20+ (22 is fine) and npm
- Port **43185** is pinned in `npm run dev` and `npm start` so it does not collide with a default Next.js 3000
- No cloud login. No Google Fonts CDN. System fonts (Segoe UI / Georgia) so locked-down government browsers still render

Production-style:

```bash
npm run build
npm start
```

`npm start` also serves on **http://localhost:43185**.

Checks:

```bash
npm test
npm run smoke
```

With the app already running (`npm run dev` or `npm start`):

```bash
npm run smoke:http
```

## Baseline

ACTIVE AR 600-85 (4 Oct 2024, admin revs 27 Feb 2025 / 19 Feb 2026)

Seeded structure: Chapters 1–18 and Appendices A–G at paragraph level, plus glossary terms and the identification-to-rehabilitation process map. Official paragraph numbers and titles are preserved. Body text is official-style structured working-copy language for search and rewrite—not a substitute for the authenticated PDF on Army Publishing Directorate.

G–1 seal: `public/g1-seal.png` (always shown with the DRAFT banner).

## What the app does

| Area | Behavior |
| --- | --- |
| Chrome | Outline \| working-copy editor \| Assist / authority / Process. Title *AR 600-85 Rewrite — Working Copy*. Subtitle *Internal G-1 rewrite working group use only*. |
| Editing | Section edit with server autosave plus an Editor **Save** button. The original regulation pane is read-only and is never mutated. |
| Search | Queries the original regulation (read-only) only. |
| Versions | Named snapshots. Compare original regulation (above) vs your draft (below). **List the changes** / Summarize builds bullets from those diffs. |
| Tasks | Editors create and complete tasks. |
| Roles | Editor (edit / tasks / snapshots). Reviewer (read-only). Approver (ready-for-WG-review marks; can unlock). |
| Idle | Warn at 14 minutes. At 15 minutes: save current section and lock. |
| Export | Word `.docx` always DRAFT-stamped (header, footer, title-page disclaimer citing AR 25-30 / DA Pam 25-40). |
| Upload | PDF/DOCX/PPTX, 25 MB cap, filename + size + SHA-256 audit. |
| Assist | Cheech glossary lock chips; Justice Limited Use chips + AR 600-8-2 / 635-200 / 135-175 / 135-178 steers; Sergeant 22 overlap checks (Keep wording \| Insert See cite). |
| Process | ID → rehab map with branch labels. |
| Guide | In-app User Guide at `/guide` with Justice / Cheech / Sergeant blurbs and a First session walkthrough. |
| Spellcheck | Browser spellcheck on the draft editor only. Revision timeline in Assist. |

Working-copy state lives in `data/runtime/` (created at first run, not committed). Uploads go to `data/uploads/`.

## Project layout

```
app/            App Router pages and API routes
components/     Three-pane chrome and Assist tabs
lib/            Store, diff, export, roles, seed data
public/         G-1 seal; optional guide video at public/guide/
scripts/        Seed checks and smoke
```
