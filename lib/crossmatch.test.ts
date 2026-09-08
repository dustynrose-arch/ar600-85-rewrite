import assert from "node:assert/strict";
import { test } from "node:test";
import { crossmatchDocument, findTermFlags, parseCites } from "./crossmatch.ts";
import type { DraftLike } from "./crossmatch.ts";

function section(id: string, title: string, body: string): DraftLike {
  return { id, number: id, title, body };
}

const draft = {
  "4-5": section(
    "4-5",
    "Inspection testing",
    [
      "a. Commanders will use Inspection Random (IR) as the primary inspection basis.",
      "  (1) IR selection is unpredictable. Do not describe this as a vague random UA program.",
      "b. Inspection Other is a separate basis and is not IR.",
      "c. Competence for duty (CO) and probable cause (PO) remain distinct.",
    ].join("\n"),
  ),
  "7-3": section(
    "7-3",
    "Self-identification",
    "Soldiers may self-refer. Limited Use Policy is not complete immunity. Command referral is a separate path. See para 10–12.",
  ),
  "10-6": section(
    "10-6",
    "Administrative actions",
    "For flagging, see AR 600-8-2. For enlisted rehabilitation failure, see AR 635-200. Do not copy those procedures here.",
  ),
  "1-7": section(
    "1-7",
    "SUDCC",
    "Clinical treatment is Substance Use Disorder Clinical Care (SUDCC). ADAPT and Prime for Life are prevention education, not rehab.",
  ),
};

const original = {
  ...draft,
  "99-1": section("99-1", "Legacy", "Old paragraph later emptied."),
};

function run(text: string, filename = "training.docx", locator = "page 1") {
  return crossmatchDocument({
    filename,
    chunks: [{ locator, text }],
    draftSections: structuredClone(draft),
    originalSections: structuredClone(original),
  });
}

test("parses para and appendix cites with submarkers", () => {
  const cites = parseCites("See para 4–5a(1) and appendix B-10. Also AR 600-85, paragraph 7-3.");
  assert.equal(cites.some((cite) => cite.sectionKey === "4-5" && cite.suffix === "a(1)"), true);
  assert.equal(cites.some((cite) => cite.sectionKey === "B-10"), true);
  assert.equal(cites.some((cite) => cite.sectionKey === "7-3"), true);
});

test("Match when upload cites the same location and the rule agrees", () => {
  const rows = run(
    "Training slide: para 4–5a(1) — commanders will use Inspection Random (IR); selection is unpredictable.",
  );
  const row = rows.find((item) => item.locationCite === "para 4–5a(1)");
  assert.ok(row);
  assert.equal(row!.verdict, "match");
  assert.equal(row!.sourceFile, "training.docx");
  assert.equal(row!.locator, "page 1");
  assert.match(row!.draftExcerpt, /IR selection/i);
  assert.match(row!.documentExcerpt, /Inspection Random/i);
});

test("Match when upload correctly says See AR for a sister publication", () => {
  const rows = run("At para 10–6, for flagging see AR 600-8-2. Do not paste flag codes into this regulation.");
  const row = rows.find((item) => item.locationCite === "para 10–6");
  assert.ok(row);
  assert.equal(row!.verdict, "match");
});

test("Miss when upload requires a rule not in the draft at that para", () => {
  const rows = run(
    "Per para 4–5a(1), commanders will confiscate privately owned vehicles after any positive result.",
  );
  const row = rows.find((item) => item.locationCite === "para 4–5a(1)");
  assert.ok(row);
  assert.equal(row!.verdict, "miss");
  assert.match(row!.reason, /not in your draft/i);
});

test("Miss when upload conflicts with draft text at a cited location", () => {
  const rows = run("para 4–5b Inspection Other is IR and commanders shall not treat it as a separate basis.");
  const row = rows.find((item) => item.locationCite === "para 4–5b");
  assert.ok(row);
  assert.equal(row!.verdict, "miss");
});

test("Miss when upload points to a wrong or rescinded para number", () => {
  const wrong = run("See para 88–1 for the UA program.");
  assert.equal(wrong[0]?.verdict, "miss");
  assert.match(wrong[0]!.reason, /wrong number/i);

  const emptied = {
    ...structuredClone(draft),
    "99-1": section("99-1", "Legacy", "   "),
  };
  const rescinded = crossmatchDocument({
    filename: "par.docx",
    chunks: [{ locator: "page 2", text: "Continue using para 99–1 for collection." }],
    draftSections: emptied,
    originalSections: original,
  });
  assert.equal(rescinded[0]?.verdict, "miss");
  assert.match(rescinded[0]!.reason, /rescinded/i);
});

test("Miss when upload copies sister-pub flag or separation lanes", () => {
  const rows = run(
    "At para 10–6 commanders will initiate a flag using flag codes and prepare the separation packet and characterization of service board.",
  );
  const row = rows.find((item) => item.verdict === "miss" && /600-8-2|635-200/.test(item.reason));
  assert.ok(row);
});

test("Miss when training/PAR uses unlocked ASAP terms from the locked list", () => {
  const samples: Array<[string, string]> = [
    ["The random UA is scheduled Friday.", "Inspection Random"],
    ["Inspection Other is IR for this unit.", "Inspection Other"],
    ["Use a fitness test when the commander wants a test.", "competence for duty"],
    ["Probable cause is the same as competence for duty and IR.", "probable cause"],
    ["Illicit use means prescription misuse.", "illicit use"],
    ["Send the Soldier to ASAP counseling or a treatment center.", "SUDCC"],
    ["ADAPT is the SUDCC rehab course.", "ADAPT"],
    ["Put the Soldier in EAP instead of the TDP roster.", "EAP"],
    ["Self-referral grants immunity and cannot be used for any disciplinary action.", "Limited Use"],
    ["Command referral is the same as self-referral.", "command referral"],
    ["The UPL collects specimens and advises the commander.", "UPL"],
    ["Rehab failure processing is done entirely inside this regulation.", "635-200"],
  ];
  for (const [text, expect] of samples) {
    const flags = findTermFlags(text);
    assert.ok(flags.length, `expected a term flag for: ${text}`);
    assert.match(flags[0]!.reason, new RegExp(expect, "i"), text);
    const rows = run(text);
    assert.equal(rows[0]?.verdict, "miss", text);
  }
});

test("Unclear when a cite exists but the wording does not confirm match or miss", () => {
  const rows = run("See para 4–5. More to follow.");
  const row = rows.find((item) => item.locationCite === "para 4–5");
  assert.ok(row);
  assert.equal(row!.verdict, "unclear");
});

test("does not mutate the draft sections object", () => {
  const copy = structuredClone(draft);
  const before = JSON.stringify(copy);
  crossmatchDocument({
    filename: "x.docx",
    chunks: [{ locator: "page 1", text: "para 4–5a(1) commanders will confiscate vehicles." }],
    draftSections: copy,
    originalSections: original,
  });
  assert.equal(JSON.stringify(copy), before);
});

test("rows keep the locked output schema fields", () => {
  const rows = run("Training: para 4–5a(1) Inspection Random (IR) selection is unpredictable.", "deck.pptx", "slide 3");
  const row = rows[0];
  assert.ok(row);
  assert.equal(typeof row!.sourceFile, "string");
  assert.equal(row!.locator, "slide 3");
  assert.match(row!.locationCite, /^para /);
  assert.equal(typeof row!.draftExcerpt, "string");
  assert.equal(typeof row!.documentExcerpt, "string");
  assert.ok(["match", "miss", "unclear"].includes(row!.verdict));
});
