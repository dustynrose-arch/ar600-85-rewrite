export type SisterPub = {
  id: string;
  pub: string;
  title: string;
  whyCite: string;
  doNotCopy: string;
};

export const SISTER_PUBS: SisterPub[] = [
  {
    id: "ar600-8-2",
    pub: "AR 600-8-2",
    title: "Suspension of Favorable Personnel Actions (Flag)",
    whyCite: "Flagging actions tied to investigation, APFT/ACFT, or adverse action, including drug or alcohol incidents.",
    doNotCopy: "Do not paste flag codes, initiation timelines, or transfer rules into AR 600-85.",
  },
  {
    id: "ar635-200",
    pub: "AR 635-200",
    title: "Active Duty Enlisted Administrative Separations",
    whyCite: "Enlisted separation for drug abuse, alcohol rehabilitation failure, or commission of a serious offense.",
    doNotCopy: "Do not restate characterization rules or board procedures.",
  },
  {
    id: "ar600-8-24",
    pub: "AR 600-8-24",
    title: "Officer Transfers and Discharges",
    whyCite: "Officer elimination and discharge when ASAP-related misconduct or rehabilitation failure is the basis.",
    doNotCopy: "Do not import officer show-cause process language.",
  },
  {
    id: "ar135-175",
    pub: "AR 135-175",
    title: "Separation of Officers",
    whyCite: "Reserve Component officer separations arising from substance-related misconduct.",
    doNotCopy: "Cite; do not duplicate RC officer process.",
  },
  {
    id: "ar135-178",
    pub: "AR 135-178",
    title: "Enlisted Administrative Separations",
    whyCite: "USAR/ARNG enlisted administrative separation for substance-related bases.",
    doNotCopy: "Keep component-specific separation text in the sister pub.",
  },
  {
    id: "dapam600-85",
    pub: "DA Pam 600-85",
    title: "Army Substance Abuse Program Procedures",
    whyCite: "Implementing procedures associated with this regulation.",
    doNotCopy: "Do not merge pamphlet how-to into the regulation body.",
  },
  {
    id: "ar25-30",
    pub: "AR 25-30",
    title: "Army Publishing Program",
    whyCite: "Draft marking, staffing, and publication of Army regulations.",
    doNotCopy: "This working copy is not an official publication.",
  },
  {
    id: "dapam25-40",
    pub: "DA Pam 25-40",
    title: "Army Publishing Program Procedures",
    whyCite: "Formatting, coordination, and authentication procedures for DA pubs.",
    doNotCopy: "Export remains a DRAFT working copy until officially authenticated.",
  },
  {
    id: "dodi1010",
    pub: "DoDI 1010.01 / 1010.04 / 1010.09",
    title: "DoD military and civilian drug testing instructions",
    whyCite: "Service program authority and civilian Drug-Free Workplace / DOT alignment.",
    doNotCopy: "Do not reproduce DoD cutoff tables or panel lists except by reference.",
  },
  {
    id: "42cfr2",
    pub: "42 CFR Part 2 / 42 USC 290dd-2",
    title: "Confidentiality of SUD patient records",
    whyCite: "Disclosure restrictions for treatment records; verbal-inquiry safe harbor.",
    doNotCopy: "Do not paraphrase in a way that affirms a named person is in treatment.",
  },
];

export const CITE_HOT_LIST = [
  {
    id: "hot-limited-use",
    topic: "Limited Use Policy",
    cite: "AR 600-85 paras 10–11–10–13; app B–10",
    warning: "Restating the definition in commander Q&A and in chapter 10 creates conflict risk. Keep one canonical definition.",
  },
  {
    id: "hot-flag",
    topic: "Flagging",
    cite: "AR 600-8-2",
    warning: "Do not invent ASAP-specific flag codes.",
  },
  {
    id: "hot-sep-enl",
    topic: "Enlisted separation (RA)",
    cite: "AR 635-200",
    warning: "Treatment-failure and subsequent-incident rules belong with a See citation.",
  },
  {
    id: "hot-sep-off",
    topic: "Officer separation",
    cite: "AR 600-8-24 / AR 135-175",
    warning: "Component and grade determine the governing pub.",
  },
  {
    id: "hot-sep-rc",
    topic: "RC enlisted separation",
    cite: "AR 135-178",
    warning: "Chapters 15–16 should steer, not copy, RC separation process.",
  },
  {
    id: "hot-collection",
    topic: "Urinalysis collection SOP",
    cite: "AR 600-85 app D; para 4–12",
    warning: "Chapter 4 states policy; appendix D is the SOP. Do not maintain two full SOPs.",
  },
  {
    id: "hot-confidential",
    topic: "SUD record confidentiality",
    cite: "42 CFR Part 2; paras 10–14–10–30",
    warning: "Never confirm treatment status in a verbal inquiry.",
  },
  {
    id: "hot-dot",
    topic: "DOT civilian testing",
    cite: "49 CFR Part 382; chap 5",
    warning: "DOT split-sample and SAP rules are federal; cite, do not rewrite.",
  },
  {
    id: "hot-mro",
    topic: "Medical review",
    cite: "paras 4–14, 15–8, 16–7",
    warning: "ARNG and USAR MRO paragraphs should cite the common MRO rule.",
  },
  {
    id: "hot-smart",
    topic: "Smart testing",
    cite: "para 4–10; B–12",
    warning: "Commander guide should point to 4–10 rather than invent a second technique list.",
  },
];
