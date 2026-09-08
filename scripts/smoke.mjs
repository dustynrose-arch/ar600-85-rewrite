#!/usr/bin/env node
/**
 * Static (and optional HTTP) smoke checks for a Windows clone-and-run.
 * Usage:
 *   node scripts/smoke.mjs
 *   node scripts/smoke.mjs --http   # expects npm run dev/start on port 43185
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wantHttp = process.argv.includes("--http");
const PORT = 43185;
const BANNER = "DRAFT / WORKING COPY — NOT AN OFFICIAL ARMY PUBLICATION";

let failed = 0;

function ok(label) {
  console.log(`PASS  ${label}`);
}

function fail(label, detail) {
  failed += 1;
  console.error(`FAIL  ${label}${detail ? `\n      ${detail}` : ""}`);
}

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

function mustExist(rel) {
  if (existsSync(path.join(root, rel))) ok(`exists ${rel}`);
  else fail(`missing ${rel}`);
}

function checkPackage() {
  const pkg = JSON.parse(read("package.json"));
  if (pkg.scripts?.dev?.includes("-p 43185") && pkg.scripts?.start?.includes("-p 43185")) {
    ok("npm scripts pin port 43185");
  } else {
    fail("npm scripts must use next dev/start -p 43185");
  }
}

function checkBanner() {
  const src = read("components/DraftBanner.tsx");
  if (src.includes(BANNER)) ok("Draft banner uses official working-copy wording");
  else fail("Draft banner missing required wording", BANNER);
}

function checkNoDraftLocalStorage() {
  const store = read("lib/store.ts");
  if (/localStorage/.test(store)) fail("lib/store.ts must not use localStorage");
  else ok("working-copy store is server-side (no localStorage)");
}

function checkSeed() {
  const doc = JSON.parse(read("lib/seed/baseline-document.json"));
  const chapters = doc.chapters.filter((c) => /^Chapter \d+$/.test(c.label));
  const apps = doc.chapters.filter((c) => /^Appendix [A-G]$/.test(c.label));
  const nums = chapters.map((c) => Number(c.label.replace("Chapter ", ""))).sort((a, b) => a - b);
  const expected = Array.from({ length: 18 }, (_, i) => i + 1);
  if (JSON.stringify(nums) === JSON.stringify(expected)) ok("seed has Chapters 1–18");
  else fail("seed missing Chapters 1–18", JSON.stringify(nums));
  if (apps.map((c) => c.label).join(",") === "Appendix A,Appendix B,Appendix C,Appendix D,Appendix E,Appendix F,Appendix G") {
    ok("seed has Appendices A–G");
  } else {
    fail("seed missing Appendices A–G", apps.map((c) => c.label).join(", "));
  }
  const sections = doc.chapters.flatMap((c) => c.sections);
  const empty = sections.filter((s) => !String(s.body || "").trim());
  if (empty.length === 0) ok(`${sections.length} paragraph-level sections, none empty`);
  else fail("empty section bodies", empty.map((s) => s.id).join(", "));
}

function checkLanes() {
  const src = read("lib/seed/redundancy-lanes.ts");
  const ids = [...src.matchAll(/id:\s*"(lane-\d+)"/g)].map((m) => m[1]);
  if (ids.length === 22) ok("22 redundancy lanes");
  else fail(`expected 22 redundancy lanes, found ${ids.length}`);
}

function checkGuideBlurbs() {
  const guide = read("components/UserGuide.tsx");
  for (const needle of ["Justice (Limited Use)", "Cheech (glossary lock)", "Sergeant (redundancy)"]) {
    if (guide.includes(needle)) ok(`User Guide blurb: ${needle}`);
    else fail(`User Guide missing ${needle}`);
  }
}

function checkGovFonts() {
  const layout = read("app/layout.tsx");
  if (/fonts\.googleapis|fonts\.gstatic/.test(layout)) {
    fail("layout still loads Google Fonts (blocked on many gov networks)");
  } else {
    ok("no Google Fonts CDN (gov locked-down friendly)");
  }
}

function runPythonStructure() {
  const script = path.join(root, "scripts", "check-apd-structure.py");
  const result = spawnSync("python3", [script], { cwd: root, encoding: "utf8" });
  if (result.status === 0) ok(result.stdout.trim() || "APD structure");
  else fail("APD structure check", (result.stdout || result.stderr || "").trim());
}

function runUnitTests() {
  const result = spawnSync("npm", ["test"], { cwd: root, encoding: "utf8" });
  if (result.status === 0) ok("unit tests");
  else fail("unit tests", (result.stdout || result.stderr || "").trim().split("\n").slice(-20).join("\n      "));
}

async function checkHttp() {
  const base = `http://127.0.0.1:${PORT}`;
  const routes = ["/", "/guide", "/api/state", "/g1-seal.png"];
  for (const route of routes) {
    try {
      const res = await fetch(`${base}${route}`, { redirect: "manual" });
      if (res.ok) ok(`HTTP ${route} → ${res.status}`);
      else fail(`HTTP ${route}`, `status ${res.status}`);
    } catch (err) {
      fail(`HTTP ${route}`, err instanceof Error ? err.message : String(err));
    }
  }
  try {
    const home = await fetch(base);
    const html = await home.text();
    if (html.includes("AR 600-85 Rewrite")) ok("home HTML includes working-copy title");
    else fail("home HTML missing title");
    if (html.includes(BANNER) || html.includes("NOT AN OFFICIAL ARMY PUBLICATION")) {
      ok("home HTML includes DRAFT banner text");
    } else {
      fail("home HTML missing DRAFT banner text");
    }
  } catch (err) {
    fail("home HTML body", err instanceof Error ? err.message : String(err));
  }
}

async function main() {
  console.log("AR 600-85 rewrite smoke");
  mustExist("public/g1-seal.png");
  mustExist("lib/seed/baseline-document.json");
  mustExist("app/page.tsx");
  checkPackage();
  checkBanner();
  checkNoDraftLocalStorage();
  checkSeed();
  checkLanes();
  checkGuideBlurbs();
  checkGovFonts();
  runPythonStructure();
  runUnitTests();
  if (wantHttp) await checkHttp();
  if (failed) {
    console.error(`\n${failed} smoke check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll smoke checks passed.");
}

await main();
