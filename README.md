# AR 600-85 Rewrite — Working Copy

Browser-only Next.js application for the internal Army Deputy Chief of Staff, G–1 rewrite working group. Editors maintain a **working copy** of AR 600–85 against a **read-only embedded baseline**. The baseline is never mutated.

This is the WP1–WP6 accepted build: three-pane chrome, server-side autosave, roles and gates, Assist (Cheech / Justice / Sergeant), process map, cite-don’t-copy authority, snapshots, real diffs, Word export, audited uploads, and an in-app User Guide with a clickable walkthrough plus video placeholder.

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
| Chrome | Outline \| editor \| Assist/authority. Official G–1 seal at `public/g1-seal.png`, always paired with the DRAFT / WORKING COPY banner. Title *AR 600-85 Rewrite — Working Copy*. Subtitle *Internal G-1 rewrite working group use only*. |
| Editing | Section edit with server autosave. No `localStorage`. Baseline pane is read-only. |
| Search | Queries the locked baseline only. |
| Versions | Named snapshots. Side-by-side diff vs baseline or a snapshot. **Summarize** builds bullets from those diffs. |
| Tasks | Editors create and complete tasks. |
| Roles | Editor (edit / tasks / snapshots). Reviewer (read-only). Approver (WG-review marks; can unlock). |
| Idle | Warn at 14 minutes. At 15 minutes: save current section and lock. |
| Export | Word `.docx` always DRAFT-stamped (header, footer, title-page disclaimer citing AR 25-30 / DA Pam 25-40). |
| Upload | PDF/DOCX, 25 MB cap, size + SHA-256 audit. |
| Assist | Cheech glossary lock chips; Justice Limited Use chips + AR 600-8-2 / 635-200 / 135-175 / 135-178 steers; Sergeant 22-lane redundancy detector (Keep wording \| Insert See cite). |
| Process | ID → rehab map with branch labels. |
| Authority | Cite-don’t-copy hot list and sister publications. |
| Guide | In-app User Guide at `/guide`: clickable 8-step walkthrough plus a video slot (`public/guide/tutorial.mp4` when present; otherwise “Tutorial video coming soon”). |

Working-copy state lives in `data/runtime/` (created at first run, not committed). Uploads go to `data/uploads/`.

## Project layout

```
app/            App Router pages and API routes
components/     Three-pane chrome and Assist tabs
lib/            Store, diff, export, roles, seed data
public/         Official G-1 seal (never shown without the DRAFT banner); optional guide video at public/guide/
scripts/        Baseline seed generator
```
