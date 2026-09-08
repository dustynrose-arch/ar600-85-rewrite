# AR 600-85 Rewrite — Working Copy

Browser-only Next.js application for the internal Army Deputy Chief of Staff, G–1 rewrite working group. Editors maintain a **working copy** of AR 600–85 against a **read-only embedded baseline**. The baseline is never mutated.

This is the WP1–WP7 build: three-pane chrome with collapsible outline and Assist panes, automatic save, roles and gates, Assist reminders (glossary, Limited Use, overlap checks), process map, cite-don’t-copy authority, checkpoints, side-by-side compare, Word export, audited uploads, and an in-app User Guide with a First session walkthrough plus video placeholder.

**Not an official publication.** The gold-and-black banner, Word header/footer, and title page are always marked **DRAFT / WORKING COPY**.

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
| Chrome | Outline \| editor \| Assist/authority. Official G–1 seal at `public/g1-seal.png`, always paired with the DRAFT / WORKING COPY banner. Title *AR 600-85 Rewrite — Working Copy*. Subtitle *Internal G-1 rewrite working group use only*. Outline and Assist collapse so the center editor can widen; the tab remembers that choice for the session. |
| Editing | Section edit with automatic save. Baseline pane is read-only. |
| Search | Queries the locked baseline only. |
| Versions | Named snapshots. Side-by-side compare vs the original regulation or a checkpoint. **List the changes** builds bullets from those diffs. |
| Summary of Change | Outline front-matter plus Assist **Summary** tab. Auto-built Revises / Adds / Rescinds rows from original regulation (read-only) versus your draft, with APD cites (`para 1–1`, `para 1–4a(1)`). Dedicated Word export stays marked DRAFT. Moved paragraphs are a follow-up (they currently appear as Rescinds + Adds). |
| Tasks | Editors create and complete tasks. |
| Roles | Editor (edit / tasks / snapshots). Reviewer (read-only). Approver (WG-review marks; can unlock). |
| Idle | Warn at 14 minutes. At 15 minutes: save current section and lock. |
| Export | Word `.docx` always DRAFT-stamped (header, footer, title-page disclaimer citing AR 25-30 / DA Pam 25-40). Full working-copy export includes the Summary of Change. Dedicated Summary export uses the title *Summary of Change (DRAFT — working copy; not authenticated under AR 25-30)*. |
| Upload | PDF/Word, 25 MB cap, file name + size + unique file ID in the activity log. |
| Assist | Glossary locked-term reminders; Limited Use reminders + AR 600-8-2 / 635-200 / 135-175 / 135-178 cites; 22 overlap checks (Keep wording \| Insert See cite). |
| Process | ID → rehab map with branch labels. |
| Authority | Cite-don’t-copy hot list and sister publications. |
| Guide | In-app User Guide at `/guide`: First session walkthrough (anchors: outline, working-copy, assist, process, diff-export, roles), Assist help written for G–1 editors, and a video slot (`public/guide/tutorial.mp4` when present; otherwise “Tutorial video coming soon”). |

Working-copy state lives in `data/runtime/` (created at first run, not committed). Uploads go to `data/uploads/`.

## Project layout

```
app/            App Router pages and API routes
components/     Three-pane chrome and Assist tabs
lib/            Store, diff, export, roles, seed data
public/         Official G-1 seal (never shown without the DRAFT banner); optional guide video at public/guide/
scripts/        Baseline seed generator
```
