export type ProcessNode = {
  id: string;
  label: string;
  kind: "start" | "decision" | "action" | "end";
  detail: string;
  cite: string;
};

export type ProcessEdge = {
  from: string;
  to: string;
  label?: string;
};

export const PROCESS_MAP = {
  title: "Identification to rehabilitation",
  summary:
    "Six identification gates feed a Behavioral Health substance use disorder evaluation. Treatment, aftercare, command notifications, and possible administrative action branch from that evaluation.",
  nodes: [
    {
      id: "id-self",
      label: "Self-identification",
      kind: "start",
      detail: "Soldier seeks help from commander, MTF physician, or other authorized source.",
      cite: "7-3",
    },
    {
      id: "id-command",
      label: "Command identification",
      kind: "start",
      detail: "Chain of command observes indicators and consults legal advisor before Limited Use discussion.",
      cite: "7-2",
    },
    {
      id: "id-drug",
      label: "Drug testing ID",
      kind: "start",
      detail: "Confirmed laboratory positive after MRO review (or refusal).",
      cite: "7-4",
    },
    {
      id: "id-alcohol",
      label: "Alcohol testing ID",
      kind: "start",
      detail: "Screening or confirmation alcohol test, or alcohol-related incident.",
      cite: "7-5",
    },
    {
      id: "id-le",
      label: "Investigation / apprehension",
      kind: "start",
      detail: "Law enforcement or CID identification. Limited Use generally does not attach.",
      cite: "7-6",
    },
    {
      id: "id-med",
      label: "Medical identification",
      kind: "start",
      detail: "Clinician identifies possible SUD during care and refers for evaluation.",
      cite: "7-7",
    },
    {
      id: "legal-screen",
      label: "Legal screen",
      kind: "decision",
      detail: "Does Limited Use potentially apply? Consult SJA before discussing protections.",
      cite: "10-11",
    },
    {
      id: "refer-bh",
      label: "Refer to BH / SUD evaluation",
      kind: "action",
      detail: "Command referral is mandatory when SUD is suspected. Participation is mandatory if command-referred.",
      cite: "7-1",
    },
    {
      id: "eval",
      label: "SUD evaluation",
      kind: "decision",
      detail: "Clinically indicated for treatment, ADAPT only, or no program?",
      cite: "8-2",
    },
    {
      id: "adapt",
      label: "ADAPT",
      kind: "action",
      detail: "Complete Alcohol and Drug Abuse Prevention Training within the prescribed window.",
      cite: "9-14",
    },
    {
      id: "treat",
      label: "SUD treatment",
      kind: "action",
      detail: "Outpatient or other clinically indicated care; rehabilitation team meeting includes the commander.",
      cite: "8-1",
    },
    {
      id: "notify",
      label: "Mandatory command notifications",
      kind: "action",
      detail: "Treatment providers notify command of attendance, progress, and risk issues as required.",
      cite: "8-4",
    },
    {
      id: "aftercare",
      label: "Aftercare",
      kind: "action",
      detail: "Follow-up after primary treatment to support retention and reduce recidivism.",
      cite: "8-5",
    },
    {
      id: "admin",
      label: "Admin / UCMJ branch",
      kind: "decision",
      detail: "Independent evidence, subsequent incident, or treatment failure may trigger flag, UCMJ, or separation.",
      cite: "10-4",
    },
    {
      id: "sep",
      label: "Separation processing",
      kind: "end",
      detail: "Cite AR 635-200, AR 600-8-24, AR 135-175, or AR 135-178. Do not copy those texts here.",
      cite: "10-6",
    },
    {
      id: "retain",
      label: "Retain and monitor",
      kind: "end",
      detail: "Successful participation; continue deterrence testing and leader engagement.",
      cite: "8-5",
    },
  ] satisfies ProcessNode[],
  edges: [
    { from: "id-self", to: "legal-screen", label: "self-referral" },
    { from: "id-command", to: "legal-screen", label: "command ID" },
    { from: "id-drug", to: "refer-bh", label: "confirmed +" },
    { from: "id-alcohol", to: "refer-bh", label: "incident / +" },
    { from: "id-le", to: "refer-bh", label: "apprehension" },
    { from: "id-med", to: "refer-bh", label: "clinical" },
    { from: "legal-screen", to: "refer-bh", label: "refer" },
    { from: "refer-bh", to: "eval" },
    { from: "eval", to: "adapt", label: "education" },
    { from: "eval", to: "treat", label: "clinical" },
    { from: "eval", to: "retain", label: "no SUD" },
    { from: "adapt", to: "notify" },
    { from: "treat", to: "notify" },
    { from: "notify", to: "aftercare" },
    { from: "aftercare", to: "admin" },
    { from: "admin", to: "sep", label: "fail / new incident" },
    { from: "admin", to: "retain", label: "success" },
    { from: "adapt", to: "admin", label: "non-complete" },
  ] satisfies ProcessEdge[],
};
