export type GlossaryTerm = {
  id: string;
  term: string;
  acronym?: string;
  definition: string;
  locked: boolean;
  cite: string;
};

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: "adapt",
    term: "Alcohol and Drug Abuse Prevention Training",
    acronym: "ADAPT",
    definition:
      "An educational and motivational course focused on the adverse effects and consequences of alcohol and other drug abuse. Referral and completion timelines are prescribed in this regulation.",
    locked: true,
    cite: "paras 9–14, 3–8",
  },
  {
    id: "asap",
    term: "Army Substance Abuse Program",
    acronym: "ASAP",
    definition:
      "The Army’s integrated deterrence, prevention, testing, and referral program for alcohol and other drug abuse.",
    locked: true,
    cite: "para 1–1",
  },
  {
    id: "bac",
    term: "Base Area Code",
    acronym: "BAC",
    definition: "Unique code used for reporting urinalysis results and identifying the submitting collection activity.",
    locked: true,
    cite: "app D",
  },
  {
    id: "damis",
    term: "Drug and Alcohol Management Information System",
    acronym: "DAMIS",
    definition: "Authoritative Army information system for ASAP testing, referral, and program metrics.",
    locked: true,
    cite: "chap 14",
  },
  {
    id: "dtc",
    term: "Drug Testing Coordinator",
    acronym: "DTC",
    definition:
      "Certified official who manages installation or component drug testing collections, quality control, and shipment to the FTDTL.",
    locked: true,
    cite: "paras 2–21, 9–7",
  },
  {
    id: "eap",
    term: "Employee Assistance Program",
    acronym: "EAP",
    definition:
      "Confidential assessment, short-term counseling, and referral services for DA Civilian employees and eligible Family members.",
    locked: true,
    cite: "chap 6",
  },
  {
    id: "ftdtl",
    term: "Forensic Toxicology Drug Testing Laboratory",
    acronym: "FTDTL",
    definition:
      "DoD forensic laboratory that tests urine specimens under chain of custody and reports results at established cutoff levels.",
    locked: true,
    cite: "chap 11",
  },
  {
    id: "limited-use",
    term: "Limited Use Policy",
    definition:
      "Policy that prohibits the Government from using certain protected evidence against a Soldier under the UCMJ or on characterization of service, in order to encourage self-referral. It is not a shield for later misconduct or for avoiding lawful orders to test.",
    locked: true,
    cite: "paras 10–11 through 10–13",
  },
  {
    id: "mro",
    term: "Medical Review Officer",
    acronym: "MRO",
    definition:
      "Licensed physician who reviews laboratory-positive results to determine whether a legitimate medical explanation exists.",
    locked: true,
    cite: "para 4–14",
  },
  {
    id: "rrp",
    term: "Risk Reduction Program",
    acronym: "RRP",
    definition:
      "Commander’s tool that compiles high-risk incident data and supports targeted prevention and intervention.",
    locked: true,
    cite: "chap 12",
  },
  {
    id: "smart-testing",
    term: "Smart testing",
    definition:
      "Unpredictable selection of testers, dates, times, and locations so Soldiers cannot anticipate a urinalysis event.",
    locked: true,
    cite: "para 4–10",
  },
  {
    id: "sud",
    term: "Substance use disorder",
    acronym: "SUD",
    definition: "Clinically diagnosed disorder involving problematic use of alcohol or other drugs.",
    locked: true,
    cite: "chap 8",
  },
  {
    id: "sudcc",
    term: "Substance Use Disorder Clinical Care",
    acronym: "SUDCC",
    definition:
      "Clinical treatment capability integrated with the Behavioral Health System of Care; not itself a garrison ASAP function.",
    locked: true,
    cite: "para 1–7",
  },
  {
    id: "tdp",
    term: "Testing Designated Position",
    acronym: "TDP",
    definition:
      "Civilian position identified for Drug-Free Workplace or DOT testing because of safety, security, or regulatory sensitivity.",
    locked: true,
    cite: "chap 5",
  },
  {
    id: "udl",
    term: "Unit Deterrence Leader",
    acronym: "UDL",
    definition:
      "Certified unit official who conducts collections, protects roster integrity, and supports the commander’s deterrence program. Formerly unit prevention leader.",
    locked: true,
    cite: "paras 2–33, 9–6",
  },
  {
    id: "uri",
    term: "Unit Risk Inventory",
    acronym: "URI",
    definition:
      "Anonymous command-climate survey used to identify unreported high-risk behaviors, typically 120 days before deployment.",
    locked: true,
    cite: "para 12–6",
  },
  {
    id: "r-uri",
    term: "Reintegration Unit Risk Inventory",
    acronym: "R-URI",
    definition: "Post-deployment anonymous survey administered 30 to 180 days after return from operational deployment.",
    locked: true,
    cite: "para 12–6",
  },
  {
    id: "web-dtp",
    term: "Web-based Drug Testing Program",
    acronym: "Web DTP",
    definition:
      "DoD software used to select testers and prepare DD Form 2624, labels, and unit ledgers. Units should submit at least 95 percent of specimens using Web DTP.",
    locked: true,
    cite: "para 4–21",
  },
  {
    id: "dprr",
    term: "Directorate of Prevention, Resilience and Readiness",
    acronym: "DPRR",
    definition: "HQDA activity under DCS, G–9 that oversees garrison ASAP deterrence, prevention, and related resources.",
    locked: true,
    cite: "para 2–3",
  },
  {
    id: "self-id",
    term: "Voluntary (self) identification",
    definition:
      "A Soldier’s communication to command, a physician, or another authorized source that the Soldier has an alcohol or other drug problem and seeks help.",
    locked: true,
    cite: "para 7–3",
  },
];
