# AR 600-85 Rewrite

Browser-only Next.js application for the internal Army Deputy Chief of Staff, G–1 rewrite working group. Editors maintain a **working copy** of AR 600–85 against a **read-only embedded baseline**. The baseline is never mutated.

This is the WP1–WP9 build: three-pane chrome with collapsible outline and Writing Assistant panes, automatic save, roles and gates, Assist reminders (glossary, Limited Use Policy (self-referral) vs legal / adverse-action hints, overlap checks), process map, cite-don’t-copy authority, checkpoints, stacked compare (original regulation above your draft), Word export, audited uploads, Editor-only working-copy structure edits, an in-app User Guide with a First session walkthrough plus video placeholder, a Training sandbox (separate saved data, Reset to original), and a private shared-host path (Vercel Blob + optional KV, Secure cookies, WG access).

**Not an official publication.** The header always shows a **DRAFT** mark (or **TRAINING / DRAFT** in Training), paired with the G–1 and Army seals — never seals alone. Word header/footer and title page stay stamped **DRAFT / WORKING COPY** (Training: **TRAINING / DRAFT / WORKING COPY**).

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
| Chrome | Outline \| editor \| Writing Assistant / authority. Official G–1 seal (`public/g1-seal.png`) then official Department of the Army emblem (`public/army-seal.png`, unframed) on the left, then title *AR 600-85 Rewrite*, DPRR subtitle, and a persistent header **DRAFT** mark (**TRAINING / DRAFT** in Training) — never seals alone, no hide control. Gold actions follow on the same row (Role, Training, Plain / Track Changes / Summary, User Guide). The editor pane is labeled **Your draft**. Outline and Writing Assistant collapse so the center editor can widen; the tab remembers that choice for the session. |
| Editing | Section edit with automatic save plus an Editor-only **Save** button (timeline: “Manual save”). The original regulation pane is read-only. Your draft has Undo (button and Ctrl+Z / ⌘Z) and browser spellcheck; the original regulation pane is not spellchecked. Hide outline / Hide Writing Assistant live on those side panes only — not in the center chrome. |
| Structure | Editors only (Reviewer/Approver get 403). Add before/after/child, split, delete (confirm), rename title, drag-reorder including across chapters. Stable node ids stay put; display numbers renumber IAW AR 25-30 / DA Pam 25-40. Every add/delete/move/rename/split is audited. ACTIVE baseline seed is never written. Assist chips, Process highlight, tasks, drafts, and snapshots keep the stable id. Split leaves chips on the source; delete drops assist state for that id. |
| Search | Queries the original regulation (read-only) only. |
| Versions | Named snapshots. Compare original regulation (above) vs your draft (below), or vs a checkpoint. **List the changes** builds bullets from those diffs. |
| Summary of Change | Outline front-matter plus Writing Assistant **Summary** tab. Auto-built Revises / Adds / Rescinds / Moves rows from original regulation (read-only) versus your draft, with APD cites (`para 1–1`, `para 1–4a(1)`). Structure and title changes are flagged; body keystrokes still produce wording rows only. Dedicated Word export stays marked DRAFT. |
| Tasks | Editors create and complete tasks. |
| Roles | Editor (edit / tasks / snapshots). Reviewer (read-only). Approver (WG-review marks; can unlock). |
| Idle | Warn at 14 minutes. At 15 minutes: save current section and lock. |
| Export | Word `.docx` always DRAFT-stamped (header, footer, title-page disclaimer citing AR 25-30 / DA Pam 25-40). Training exports also stamp **TRAINING / DRAFT** in the footer (header and title already say TRAINING). Full working-copy export includes the Summary of Change table. Dedicated Summary export uses the title *Summary of Change (DRAFT — working copy; not authenticated under AR 25-30 / DA Pam 25-40)* with columns Action \| Location \| Original (ACTIVE) \| Revised (your draft). |
| Upload / compare | Editors and Approvers upload `.docx`, `.pdf`, or `.pptx` (25 MB). Old `.doc` / `.ppt` are rejected with a toast. Activity log stores who, when, filename, size, and SHA-256. Compare lists suggestion-only Match / Miss / Unclear rows against your draft (source + page/slide → location → draft excerpt → document excerpt → verdict). Nothing is auto-written into your draft or the original regulation. |
| Assist | Glossary locked-term reminders; legal chips split as **Limited Use Policy (self-referral)** vs **Legal / adverse-action hint** (testing bases, process path, rights / Art. 31, civilian path) + AR 600-8-2 / 635-200 / 135-175 / 135-178 cites; 22 overlap checks (Keep wording \| Insert See cite). Chips and Process-step highlight bind to the working-copy stable id only — never display numbers and never the ACTIVE baseline. |
| Process | ID → rehab map with branch labels. |
| Authority | Cite-don’t-copy hot list and sister publications. |
| Guide | In-app User Guide at `/guide`: First session walkthrough (anchors: outline, working-copy, assist, process, diff-export, roles), Assist help written for G–1 editors, and a video slot (`public/guide/tutorial.mp4` when present; otherwise “Tutorial video coming soon”). |
| Training | **Enter Training** / **Leave Training** in the top bar. Training is a practice copy of the same app. A TRAINING stamp stays on the banner, title, and top bar until you leave. Word export from Training is marked TRAINING and DRAFT in the header, title, and footer. **Reset to original** (Editor or Approver; confirm first) wipes the training copy back to the seed. |

Working-copy state lives in `data/runtime/` locally (created at first run, not committed). Uploads go to `data/uploads/`. Training uses parallel paths: `data/runtime-training/` and `data/uploads-training/`. On Vercel those paths are ephemeral — see **WP9 Shared host**. The tab remembers Training vs live in the `ar60085-workspace` cookie (`training` or `live`; `Secure; SameSite=Lax` on HTTPS, no Secure on `http://localhost`).

## WP9 Shared host

Private shared deploy for ~20 unclassified WG seats. This URL is a **DRAFT rewrite tool**, not an authenticated AR or official Army system. Dual seals stay paired with the header DRAFT / TRAINING / DRAFT mark; Word export stamps are unchanged.

### Deploy plan (Web Guard)

Persistent store on Vercel is **non-negotiable**. Serverless disk (`data/runtime/`) is ephemeral and **must not** hold drafts. The app **fails closed** at request time if `VERCEL=1` and Blob is not configured — it will not silently write Live or Training state to a filesystem that vanishes on cold start.

| Gate | What Web Guard checks |
| --- | --- |
| **Durable Live vs Training** | Private Blob objects `ar60085/live/workspace.json` and `ar60085/training/workspace.json`, plus `ar60085/{live\|training}/uploads/…`. Training **Reset to original** deletes only the training prefix. Cold start: if the Blob object is missing, seed from the embedded baseline and **PUT it to Blob**; later instances **GET with `useCache: false`**. Saves overwrite the same pathname (`allowOverwrite`). Optional KV lock keys `ar60085:lock:live` and `ar60085:lock:training`. |
| **Auth** | **Option A:** Vercel **Deployment Protection → Password Protection** (Pro, **All Deployments**) before the app. Code hook: `WG_ACCESS_SECRET` sets httpOnly `ar60085-wg` (`Secure; SameSite=Lax` on HTTPS) and `/access` (labeled DRAFT tool — not an official/authenticated AR). Not NextAuth. Unauthenticated `/` redirects to `/access`; `/api/*` returns 401. |
| **Cookies** | `ar60085-workspace` remembers Live vs Training (`Secure; SameSite=Lax` on HTTPS; no Secure on `http://localhost`). |

**Chosen stack:** Vercel (Next.js) + **private Vercel Blob** (required) + optional **Vercel KV** write lock.

Vercel also caps serverless request bodies at ~4.5 MB, so 25 MB uploads go **browser → Blob**, then the API records the audit row. A sibling host (Fly.io or Render with a volume) is only for leaving Vercel — it is **not** a Vercel plan that keeps drafts on disk.

### Exact Dustyn steps

1. **Connect the GitHub repo**
   - Open [https://vercel.com/new](https://vercel.com/new) and sign in with GitHub (the account that can see `dustynrose-arch/ar600-85-rewrite`).
   - **Add New… → Project**.
   - Import **`dustynrose-arch/ar600-85-rewrite`**.
   - Framework Preset: **Next.js** (auto). Root Directory: `.` . Build: `next build`. Output: default.
   - Click **Deploy** once. The first build may boot on empty storage; continue below before sharing the URL.

2. **Create a private Blob store (drafts + 25 MB uploads)**
   - In the project: **Storage → Create Database / Create Store → Blob**.
   - Access: **Private** (not public).
   - Name e.g. `ar60085-wg`. Environments: **Production** and **Preview**.
   - **Create**. Vercel adds `BLOB_READ_WRITE_TOKEN` (and often `BLOB_STORE_ID`) to the project.
   - Confirm **Settings → Environment Variables** includes `BLOB_READ_WRITE_TOKEN` for Production and Preview. Client uploads **require** this token (OIDC alone is not enough for `handleUpload`).
   - Redeploy: **Deployments → ⋯ → Redeploy** (or push a commit).

3. **Optional KV lock (~20 concurrent editors)**
   - **Storage → Create Database → KV** (Upstash Redis).
   - Connect to this project. Confirm `KV_REST_API_URL` and `KV_REST_API_TOKEN` exist.
   - Redeploy.

4. **Env vars** (Settings → Environment Variables). See `.env.example`.
   - Required on Vercel: `BLOB_READ_WRITE_TOKEN`. Without it the production app **refuses to store drafts** (no ephemeral disk fallback).
   - Optional: `KV_REST_API_URL`, `KV_REST_API_TOKEN`.
   - Optional app password: `WG_ACCESS_SECRET` (long random string). Use this on Hobby, or as a second gate on Pro.
   - Do **not** set NextAuth vars. This path does not use email login.

5. **Enable protection before sharing the URL**
   - **Pro (recommended):** Project → **Settings → Deployment Protection** (sidebar; some dashboards list it under **Security**).
     - **Password Protection**: toggle **On**.
     - Scope: **All Deployments** so the production `*.vercel.app` URL is covered, not only preview URLs.
     - Enter a WG password. **Save**.
     - Paid note: Password Protection is **not on Hobby**. On Pro it is billed **per protected project** (Vercel listed **$20 / project / month** as of September 2026). Standard Protection (Vercel login) is included but only lets Vercel-team accounts in — use Password Protection so the ~20 WG seats do not all need Vercel logins.
   - **Hobby:** Password Protection is unavailable. Set `WG_ACCESS_SECRET` and redeploy. Visitors hit `/access` (clearly labeled a DRAFT tool, not a CAC/official login). Share that password out-of-band.
   - If both Pro Password Protection **and** `WG_ACCESS_SECRET` are on, editors enter **two** passwords. Prefer Pro Password Protection alone, or Hobby + `WG_ACCESS_SECRET` alone.

6. **Share the private URL**
   - Copy the Production URL from the project **Domains** tab.
   - Send WG seats the URL plus the Vercel (or `WG_ACCESS_SECRET`) password. Tell them this is a **working-copy DRAFT**, not authenticated AR 600-85.

Local: `npm run dev` stays on disk; cookies are not Secure on `http://localhost`.

### Web Guard should re-check

- Durable store: Blob configured; Live `ar60085/live/workspace.json` vs Training `ar60085/training/workspace.json`; a save + new instance / cold start still shows the draft (not a re-seed).
- Missing Blob on Vercel: request fails with the Blob-required error — **not** a successful empty workspace on disk.
- Auth gate: Vercel Password Protection (Pro, All Deployments) and/or `/access` + `WG_ACCESS_SECRET` before the workbench. No CAC / “official publication” chrome.
- `ar60085-workspace` (and `ar60085-wg` if the app secret is set) sent as `Secure; SameSite=Lax` on HTTPS; still set on localhost HTTP without Secure.
- Training reset / uploads must not change the live Blob prefix.
- Header DRAFT / TRAINING / DRAFT marks, dual seals, upload allowlist, roles, and Word stamps unchanged.


## Project layout

```
app/            App Router pages and API routes
components/     Three-pane chrome and Assist tabs
lib/            Store, diff, export, roles, seed data
public/         Official G-1 seal and Army emblem (never shown without the DRAFT banner); optional guide video at public/guide/
scripts/        Baseline seed generator
```
