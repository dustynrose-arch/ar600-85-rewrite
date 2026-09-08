#!/usr/bin/env python3
"""Generate baseline document seed. Does not overwrite an existing official G-1 seal."""
from __future__ import annotations

import json
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

CHAPTERS = [
    ("1", "Chapter 1", "General"),
    ("2", "Chapter 2", "Responsibilities"),
    ("3", "Chapter 3", "Alcohol"),
    ("4", "Chapter 4", "Military Personnel Deterrence Drug Testing Program"),
    ("5", "Chapter 5", "Department of the Army Civilian Employee Drug Testing"),
    ("6", "Chapter 6", "Department of the Army Civilian Employee ASAP Services"),
    ("7", "Chapter 7", "Identification, Referral for Treatment"),
    ("8", "Chapter 8", "Types of Substance Use Disorder Treatment"),
    ("9", "Chapter 9", "Prevention, Education, and Training"),
    ("10", "Chapter 10", "Legal and Administrative Procedures, and Media Relations"),
    ("11", "Chapter 11", "Drug Testing Laboratory Operations"),
    ("12", "Chapter 12", "Risk Reduction Program"),
    ("13", "Chapter 13", "Comprehensive Assessment"),
    ("14", "Chapter 14", "Army Substance Abuse Services Information and Records Management"),
    ("15", "Chapter 15", "Army Substance Abuse Program in the Army National Guard"),
    ("16", "Chapter 16", "Army Substance Abuse Program in the U.S. Army Reserve"),
    ("17", "Chapter 17", "Awards and Campaigns"),
    ("18", "Chapter 18", "Army Substance Abuse Program Resource Management"),
    ("A", "Appendix A", "References"),
    ("B", "Appendix B", "Unit Commander’s Guide to the Army Substance Abuse Program"),
    ("C", "Appendix C", "Army Substance Abuse Program Assessment Checklist"),
    ("D", "Appendix D", "Standing Operating Procedures for Urinalysis Collection, Processing, and Shipping"),
    ("E", "Appendix E", "Drug Testing Supplies"),
    ("F", "Appendix F", "Army Substance Abuse Program Professional Code of Ethics"),
    ("G", "Appendix G", "Internal Control Evaluation"),
]

# Official 4 Oct 2024 paragraph numbers and titles (cleaned from the published regulation).
PARAS: list[tuple[str, str, str]] = [
    ("1", "1-1", "Purpose"),
    ("1", "1-2", "References, forms, and explanation of abbreviations"),
    ("1", "1-3", "Associated publications"),
    ("1", "1-4", "Responsibilities"),
    ("1", "1-5", "Records management (recordkeeping) requirements"),
    ("1", "1-6", "Program authority"),
    ("1", "1-7", "Army Substance Abuse Program concept and principles"),
    ("1", "1-8", "Army Substance Abuse Program eligibility criteria"),
    ("1", "1-9", "Labor relations"),
    ("2", "2-1", "Chief, National Guard Bureau"),
    ("2", "2-2", "Deputy Chief of Staff, G–1"),
    ("2", "2-3", "Deputy Chief of Staff, G–9"),
    ("2", "2-4", "Deputy Chief of Staff, G–3/5/7"),
    ("2", "2-5", "The Surgeon General"),
    ("2", "2-6", "The Judge Advocate General"),
    ("2", "2-7", "Commanders of Army commands, Army service component commands, and direct reporting units"),
    ("2", "2-8", "Commanding General, U.S. Army Training and Doctrine Command"),
    ("2", "2-9", "Commanding General, U.S. Army Materiel Command–Army Installation Management Command"),
    ("2", "2-10", "Chief, U.S. Army Reserve"),
    ("2", "2-11", "Director, U.S. Army Criminal Investigation Command"),
    ("2", "2-12", "Commander, U.S. Army Corps of Engineers"),
    ("2", "2-13", "Director of Army Safety"),
    ("2", "2-14", "Commanders of medical readiness commands"),
    ("2", "2-15", "Commanders of corps, divisions, and brigades"),
    ("2", "2-16", "Military treatment facility commanders"),
    ("2", "2-17", "Installation or garrison commanders"),
    ("2", "2-18", "Installation Army Substance Abuse Program managers"),
    ("2", "2-19", "Installation prevention coordinators"),
    ("2", "2-20", "Installation employee assistance program coordinators"),
    ("2", "2-21", "Drug testing coordinators"),
    ("2", "2-22", "Installation Risk Reduction Program coordinators"),
    ("2", "2-23", "Installation Director of Psychological Health"),
    ("2", "2-24", "Installation provost marshals"),
    ("2", "2-25", "Installation safety officers"),
    ("2", "2-26", "Installation physical security officers"),
    ("2", "2-27", "Installation prevention team members"),
    ("2", "2-28", "Civilian Human Resources Servicing Center"),
    ("2", "2-29", "Battalion and/or squadron commanders"),
    ("2", "2-30", "Commanders of companies, detachments, and equivalent units"),
    ("2", "2-31", "Supervisors of Department of the Army Civilian employees"),
    ("2", "2-32", "Battalion deterrence leaders"),
    ("2", "2-33", "Company, detachment, and equivalent unit deterrence leaders"),
    ("2", "2-34", "Officers and noncommissioned officers in leadership positions"),
    ("3", "3-1", "General"),
    ("3", "3-2", "Policy"),
    ("3", "3-3", "Alcohol sanctions"),
    ("3", "3-4", "Authorized purposes for military alcohol testing"),
    ("3", "3-5", "Screening alcohol testing (not for evidence use)—military"),
    ("3", "3-6", "Confirmation alcohol testing (for evidence use)—military"),
    ("3", "3-7", "Alcohol testing rate—military"),
    ("3", "3-8", "Alcohol incident referral—military"),
    ("3", "3-9", "Civilian employees not subject to Department of Transportation regulations on alcohol"),
    ("3", "3-10", "Civilian employees subject to Department of Transportation rules—prohibitions and consequences"),
    ("3", "3-11", "Categories of alcohol testing and required procedures for employees subject to DOT rules"),
    ("3", "3-12", "Alcohol tests for civilian employees under Department of Transportation rules"),
    ("3", "3-13", "Installation substance abuse professional evaluation of employees tested under DOT rules"),
    ("4", "4-1", "General"),
    ("4", "4-2", "Policy"),
    ("4", "4-3", "Hallmarks of a good unit drug testing program"),
    ("4", "4-4", "Drugs for which testing is conducted"),
    ("4", "4-5", "Purposes for conducting drug testing"),
    ("4", "4-6", "Drug testing in the reserve components"),
    ("4", "4-7", "Deployed drug testing"),
    ("4", "4-8", "Special drug testing programs"),
    ("4", "4-9", "Drug testing coordinator, base area code manager, battalion deterrence leader, and unit deterrence leader"),
    ("4", "4-10", "Smart testing techniques"),
    ("4", "4-11", "Pre-collection procedures"),
    ("4", "4-12", "Collection procedures"),
    ("4", "4-13", "Post-collection procedures"),
    ("4", "4-14", "Medical review officers and review of positive urinalysis drug testing results"),
    ("4", "4-15", "Managing drug test results and medical reviews"),
    ("4", "4-16", "Inspections"),
    ("4", "4-17", "Statistical management"),
    ("4", "4-18", "Physical security"),
    ("4", "4-19", "Retesting specimens"),
    ("4", "4-20", "Forensic sufficiency and discrepancy management"),
    ("4", "4-21", "Drug testing program software"),
    ("4", "4-22", "Maintaining drug testing program records"),
    ("4", "4-23", "Pre-service use of drugs"),
    ("4", "4-24", "Drug testing supplies"),
    ("5", "5-1", "Purpose"),
    ("5", "5-2", "Background"),
    ("5", "5-3", "Policy"),
    ("5", "5-4", "Objectives"),
    ("5", "5-5", "Applicability"),
    ("5", "5-6", "Categories of Drug-Free Workplace drug testing"),
    ("5", "5-7", "Drugs for which testing is conducted"),
    ("5", "5-8", "Drug-Free Workplace Testing Designated Positions"),
    ("5", "5-9", "Identification of additional Testing Designated Positions"),
    ("5", "5-10", "Testing Designated Positions within the U.S. Army Corps of Engineers"),
    ("5", "5-11", "Civilian employees in critical safety or security positions"),
    ("5", "5-12", "Drug testing coordinator qualifications, training, and certification"),
    ("5", "5-13", "Pre-collection procedures for random Testing Designated Positions testing"),
    ("5", "5-14", "Collection procedures"),
    ("5", "5-15", "Post-collection procedures"),
    ("5", "5-16", "Medical review and reporting of Drug-Free Workplace test results"),
    ("5", "5-17", "Statistical management"),
    ("5", "5-18", "Refusal to test"),
    ("5", "5-19", "Disciplinary and adverse actions"),
    ("5", "5-20", "Suspension from Testing Designated Positions and Personnel Reliability Program positions"),
    ("5", "5-21", "Deployed drug testing"),
    ("5", "5-22", "Department of Transportation drug testing program objectives"),
    ("5", "5-23", "Applicability of Department of Transportation rules"),
    ("5", "5-24", "Safety-sensitive functions"),
    ("5", "5-25", "Department of Transportation prohibitions and consequences"),
    ("5", "5-26", "Department of Transportation categories of drug and alcohol testing"),
    ("5", "5-27", "Department of Transportation testing procedures and required education and training"),
    ("5", "5-28", "Department of Transportation frequency of random alcohol and other drug testing"),
    ("5", "5-29", "Specimen collection for Department of Transportation drug testing"),
    ("5", "5-30", "Medical review and the reporting of Department of Transportation drug test results"),
    ("5", "5-31", "Alcohol testing under Department of Transportation rules"),
    ("5", "5-32", "Substance abuse professional evaluation, referral, and follow-up"),
    ("5", "5-33", "Department of Transportation reporting requirements"),
    ("5", "5-34", "Statistical management of Department of Transportation testing"),
    ("6", "6-1", "General"),
    ("6", "6-2", "Policy"),
    ("6", "6-3", "Purpose of the Employee Assistance Program"),
    ("6", "6-4", "Referral"),
    ("6", "6-5", "Family member services"),
    ("6", "6-6", "Conflict of interest—Employee Assistance Program coordinator and civilian drug testing"),
    ("6", "6-7", "Confidentiality of civilian client records and information"),
    ("6", "6-8", "Confidentiality of alcohol and drug test results"),
    ("7", "7-1", "Overview"),
    ("7", "7-2", "Methods of identification"),
    ("7", "7-3", "Voluntary (self) identification and referral"),
    ("7", "7-4", "Drug testing identification"),
    ("7", "7-5", "Alcohol testing identification"),
    ("7", "7-6", "Investigation and apprehension identification"),
    ("7", "7-7", "Medical identification"),
    ("8", "8-1", "Types of Substance Use Disorder treatment services"),
    ("8", "8-2", "Criteria of Substance Use Disorder treatment services"),
    ("8", "8-3", "Rehabilitation team meeting"),
    ("8", "8-4", "Mandatory command notifications"),
    ("8", "8-5", "Aftercare"),
    ("9", "9-1", "Alcohol, other drug abuse, and gambling disorder prevention, education, and training"),
    ("9", "9-2", "Policy"),
    ("9", "9-3", "Department of the Army sponsored Army Substance Abuse Program staff training"),
    ("9", "9-4", "Department of the Army training of Substance Use Disorder Clinical Care staff"),
    ("9", "9-5", "Army Substance Abuse Program staff training certifications"),
    ("9", "9-6", "Battalion and unit deterrence leader qualifications, training, and certification"),
    ("9", "9-7", "Drug testing coordinator qualifications, training, and certification"),
    ("9", "9-8", "Department of Transportation drug test collector, screening test technician, and installation trainer"),
    ("9", "9-9", "Deployment training"),
    ("9", "9-10", "Leadership training and schools"),
    ("9", "9-11", "Soldier substance abuse and gambling disorder awareness training"),
    ("9", "9-12", "Civilian employee substance abuse awareness training"),
    ("9", "9-13", "Family member and K–12 substance abuse awareness training"),
    ("9", "9-14", "Alcohol and other drug abuse prevention training"),
    ("9", "9-15", "Risk reduction training"),
    ("9", "9-16", "Prevention planning"),
    ("10", "10-1", "Overview"),
    ("10", "10-2", "Policy"),
    ("10", "10-3", "Use of Soldiers’ confirmed positive drug test results"),
    ("10", "10-4", "Administrative and Uniform Code of Military Justice options"),
    ("10", "10-5", "Suspension of security clearance or duty"),
    ("10", "10-6", "Separation actions—military personnel"),
    ("10", "10-7", "Granting leave"),
    ("10", "10-8", "Transfer to the Department of Veterans Affairs"),
    ("10", "10-9", "Actions before, during, and after deployments and reassignments"),
    ("10", "10-10", "Law enforcement relationship to the Army Substance Abuse Program"),
    ("10", "10-11", "Limited Use Policy"),
    ("10", "10-12", "Definition of the Limited Use Policy"),
    ("10", "10-13", "Implementation of the Limited Use Policy"),
    ("10", "10-14", "Scope of confidentiality regarding military personnel"),
    ("10", "10-15", "Confidentiality of problematic substance use patient records"),
    ("10", "10-16", "Overview of disclosure rules"),
    ("10", "10-17", "Disclosures"),
    ("10", "10-18", "Disclosure to a Family member or to any person with whom the patient has a personal relationship"),
    ("10", "10-19", "Disclosure to the patient’s attorney"),
    ("10", "10-20", "Disclosure to patient’s designee for the benefit of the patient"),
    ("10", "10-21", "Disclosure to non-Department of Defense employers, employment services, or agencies"),
    ("10", "10-22", "Disclosures in conjunction with civilian Criminal Justice System referrals"),
    ("10", "10-23", "Disclosures to the President of the United States or to Members of the United States Congress"),
    ("10", "10-24", "Disclosure for research, audits, and evaluations"),
    ("10", "10-25", "Disclosure in connection with an investigation"),
    ("10", "10-26", "Disclosure upon court orders"),
    ("10", "10-27", "Written consent requirement"),
    ("10", "10-28", "Verbal inquiries"),
    ("10", "10-29", "Authority documentation"),
    ("10", "10-30", "Penalties"),
    ("10", "10-31", "Administrative and disciplinary actions for Department of the Army Civilian employees"),
    ("10", "10-32", "Release of Army Substance Abuse Program information to the media"),
    ("10", "10-33", "Guidelines for releasing information"),
    ("10", "10-34", "Administration of public-release requests"),
    ("11", "11-1", "General"),
    ("11", "11-2", "Litigation support"),
    ("11", "11-3", "Suspected adulterated military specimens"),
    ("11", "11-4", "Special tests"),
    ("12", "12-1", "Overview"),
    ("12", "12-2", "Objectives"),
    ("12", "12-3", "Policy"),
    ("12", "12-4", "Headquarters Risk Reduction Program ad-hoc working group"),
    ("12", "12-5", "Installation and command reporting requirements"),
    ("12", "12-6", "Unit risk inventory and re-integration unit risk inventory"),
    ("12", "12-7", "Installation prevention team"),
    ("13", "13-1", "Overview"),
    ("13", "13-2", "Authority"),
    ("13", "13-3", "Process evaluation"),
    ("13", "13-4", "Program evaluation"),
    ("14", "14-1", "Overview"),
    ("14", "14-2", "Policy"),
    ("14", "14-3", "Army Substance Abuse Services reports"),
    ("14", "14-4", "Army Substance Abuse Program request to change data stored in DAMIS"),
    ("14", "14-5", "Integrated Total Army Personnel Database reporting requirements"),
    ("14", "14-6", "U.S. Army Medical Command reporting requirements"),
    ("14", "14-7", "Records retention and ARIMS alignment"),
    ("14", "14-8", "Overview of DAMIS products"),
    ("14", "14-9", "The Drug and Alcohol Management Information System reports"),
    ("14", "14-10", "Drug and Alcohol Management Information System metrics"),
    ("15", "15-1", "Scope"),
    ("15", "15-2", "Applicability"),
    ("15", "15-3", "Chief Surgeon, Army National Guard"),
    ("15", "15-4", "Chief, Substance Abuse Section"),
    ("15", "15-5", "State adjutants general"),
    ("15", "15-6", "Drug testing coordinator"),
    ("15", "15-7", "Drug testing rate"),
    ("15", "15-8", "State medical review officer"),
    ("15", "15-9", "Specimens requiring review by a medical review officer by Department of Defense policy"),
    ("15", "15-10", "Military justice"),
    ("15", "15-11", "Unit risk inventories"),
    ("16", "16-1", "Scope"),
    ("16", "16-2", "Applicability"),
    ("16", "16-3", "Commander, U.S. Army Reserve Command"),
    ("16", "16-4", "U.S. Army Reserve Command Substance Abuse Program Manager"),
    ("16", "16-5", "Commanders of subordinate commands"),
    ("16", "16-6", "Subordinate command Alcohol and Drug Control Officer"),
    ("16", "16-7", "U.S. Army Reserve medical review officers"),
    ("16", "16-8", "Policy"),
    ("16", "16-9", "Funding considerations"),
    ("16", "16-10", "Prevention"),
    ("16", "16-11", "Referral of alcohol and illegal drug abusers in the U.S. Army Reserve"),
    ("16", "16-12", "Rehabilitation"),
    ("16", "16-13", "Drug testing guidance"),
    ("16", "16-14", "Management information system"),
    ("16", "16-15", "Evaluation"),
    ("16", "16-16", "Separation coordination"),
    ("16", "16-17", "Risk Reduction Program"),
    ("16", "16-18", "Specimens requiring review by a medical review officer based on Department of Defense policy"),
    ("17", "17-1", "General"),
    ("17", "17-2", "Army Substance Abuse Program awards"),
    ("17", "17-3", "Prevention of Substance Abuse Month"),
    ("17", "17-4", "Community Drug Awareness Award"),
    ("17", "17-5", "Installation and community recognition"),
    ("17", "17-6", "Red Ribbon and related observances"),
    ("17", "17-7", "Community campaigns"),
    ("18", "18-1", "General"),
    ("18", "18-2", "Policy"),
    ("18", "18-3", "Funding sources and their uses"),
    ("18", "18-4", "Manpower staffing"),
    ("A", "A-1", "Required publications"),
    ("A", "A-2", "Related publications"),
    ("A", "A-3", "Prescribed forms"),
    ("A", "A-4", "Referenced forms"),
    ("B", "B-1", "What is the Army Substance Abuse Program?"),
    ("B", "B-2", "What is the unit commander’s role in the Army Substance Abuse Program?"),
    ("B", "B-3", "What specifically must the unit commander do?"),
    ("B", "B-4", "Who are the Army Substance Abuse Program key players?"),
    ("B", "B-5", "What process should be followed if a unit commander suspects a Soldier of alcohol and/or other drug abuse?"),
    ("B", "B-6", "What does the unit commander do when notified that a Soldier has tested positive?"),
    ("B", "B-7", "What can I expect when a Soldier is enrolled in treatment?"),
    ("B", "B-8", "How is a commander included in a Soldier’s treatment when enrolled in mandatory care?"),
    ("B", "B-9", "How should a unit commander prepare for a deployment?"),
    ("B", "B-10", "What is the Limited Use Policy?"),
    ("B", "B-11", "How do I get a Unit Deterrence Leader certified?"),
    ("B", "B-12", "What is smart testing?"),
    ("C", "C-1", "Objective"),
    ("C", "C-2", "Program management"),
    ("C", "C-3", "Prevention and Employee Assistance Program"),
    ("C", "C-4", "Risk Reduction Program"),
    ("C", "C-5", "Drug testing procedures"),
    ("C", "C-6", "Treatment program"),
    ("D", "D-1", "General"),
    ("D", "D-2", "Purpose and applicability of the standing operating procedure"),
    ("D", "D-3", "Related material"),
    ("D", "D-4", "Pre-collection procedures"),
    ("D", "D-5", "Collection procedures"),
    ("D", "D-6", "Post-collection procedures"),
    ("D", "D-7", "Specimen chain of custody (back side of DD Form 2624)"),
    ("D", "D-8", "Transfer of specimens at the drug testing collection point"),
    ("D", "D-9", "Shipping to the Forensic Toxicology Drug Testing Laboratory"),
    ("D", "D-10", "Temporary storage of urine specimens at the drug testing collection point"),
    ("D", "D-11", "Temporary storage of urine specimens at the unit level"),
    ("D", "D-12", "Unusual circumstances"),
    ("D", "D-13", "Legal provisions"),
    ("E", "E-1", "Required military collection supplies"),
    ("E", "E-2", "Required civilian urinalysis collection supplies"),
    ("F", "F-1", "Preamble"),
    ("F", "F-2", "Professional responsibility"),
    ("F", "F-3", "Confidentiality"),
    ("F", "F-4", "Professional competency"),
    ("F", "F-5", "Client protections"),
    ("F", "F-6", "Public responsibility and professional relations"),
    ("G", "G-1", "Function"),
    ("G", "G-2", "Purpose"),
    ("G", "G-3", "Instructions"),
    ("G", "G-4", "Key control questions"),
    ("G", "G-5", "Supersession"),
    ("G", "G-6", "Comments"),
]

SPECIAL_BODIES: dict[str, str] = {
    "1-1": (
        "This regulation prescribes comprehensive alcohol and drug abuse prevention and control policies, "
        "procedures, and responsibilities for Soldiers of all components, Department of the Army Civilians, "
        "and other personnel eligible for Army Substance Abuse Program (ASAP) services. The program integrates "
        "deterrence, drug testing, prevention and training, and referral. Nothing in this regulation infringes "
        "on the Assistant Secretary of Defense for Health Affairs or the Defense Health Agency’s statutory and "
        "regulatory authority. If a conflict arises, the authoritative law or policy takes precedence."
    ),
    "1-6": (
        "Public Law 92–129 directed the Secretary of Defense to develop programs for identification, treatment, "
        "and rehabilitation of alcohol- or other drug-dependent persons in the Armed Forces. Public Laws 91–616 "
        "and 92–255 authorized comparable civilian programs. The Secretary of Defense requires each Service to "
        "maintain alcohol and other drug abuse prevention and control programs under DoDI 1010.01, DoDI 1010.04, "
        "and DoDI 1010.09. The Army conducts a comprehensive program to prevent and control abuse of alcohol and "
        "other drugs in response to those directives."
    ),
    "1-7": (
        "Substance abuse contributes to high-risk behavior, runs counter to Army Values, and erodes personal "
        "readiness. ASAP, administered through engaged leadership, supports readiness, resilience, and performance. "
        "The command role in prevention, testing, early identification, and administrative or judicial action is "
        "essential. The overarching tenets are deterrence, prevention, and treatment. Deterrence capabilities "
        "include drug testing, identification/detection, and referral. Prevention capabilities include awareness, "
        "education, risk reduction, interventions, and employee assistance. Substance Use Disorder Clinical Care "
        "supports treatment when clinically indicated. Abuse of alcohol, use of illegal drugs, and misuse of "
        "prescription drugs are inconsistent with Army values."
    ),
    "7-2": (
        "Early identification is a critical part of the substance use disorder evaluation process. Identification "
        "occurs through: (1) voluntary (self) identification; (2) command identification; (3) drug testing "
        "identification; (4) alcohol testing identification; (5) investigation or apprehension identification; "
        "and (6) medical identification. Commanders and supervisors intervene early and refer Soldiers suspected "
        "of alcohol or other drug-use problems to Behavioral Health for a substance use disorder evaluation. "
        "See the process map for the identification-to-rehabilitation flow and branch points."
    ),
    "7-3": (
        "Soldiers may voluntarily identify themselves as having an alcohol or other drug problem to their unit "
        "commander, a physician at a military treatment facility, or another authorized referral source. "
        "Self-identification is the preferred method of identification. Limited Use Policy protections may apply "
        "when a Soldier seeks help before receiving an order to submit to a lawful drug or alcohol test. "
        "Voluntary submission includes communicating to a member of the chain of command a desire to enter "
        "substance use disorder treatment. Limited Use protection does not apply to abuse occurring after the "
        "voluntary submission. Consult the servicing judge advocate before discussing Limited Use with a Soldier."
    ),
    "10-11": (
        "The Limited Use Policy facilitates identification of alcohol and other drug abusers by encouraging "
        "self-referral and supports rehabilitation of those who demonstrate potential for rehabilitation and "
        "retention. It allows a Soldier to obtain help without being punished for certain past offenses. It is "
        "not intended to protect a Soldier who is attempting to avoid disciplinary or adverse administrative "
        "action. When applied properly, Limited Use does not conflict with the Army’s mission or standards of "
        "discipline. This is a legally sensitive policy. Do not paraphrase the definition in a way that expands "
        "or shrinks protected evidence. Cite AR 600–8–2 for flagging, AR 635–200 for enlisted administrative "
        "separation, AR 135–175 for officer separation in the Reserve Components, and AR 135–178 for enlisted "
        "Reserve Component administrative separation. See paragraphs 10–12 and 10–13."
    ),
    "10-12": (
        "Unless waived under the circumstances in paragraph 10–13, Limited Use Policy prohibits the Government "
        "from using protected evidence against a Soldier under the UCMJ or on the issue of characterization of "
        "service in administrative proceedings. If protected evidence is used, characterization is limited to "
        "Honorable. Protected evidence is limited to evidence obtained from a Soldier’s voluntary submission to "
        "a DoD or Army rehabilitation program before the Soldier receives an order to submit to a lawful test; "
        "certain admissions made in connection with treatment; and other categories defined in this paragraph. "
        "The policy does not protect evidence of subsequent misconduct, independent evidence, or test results "
        "that indicate abuse occurring after voluntary submission. Do not copy sister-regulation separation "
        "text into this paragraph—cite the governing publication."
    ),
    "10-13": (
        "Commanders implement Limited Use only after consulting the supporting legal advisor. Explain the policy "
        "to a Soldier only when appropriate and never as a bargaining chip to obtain a confession. Limited Use "
        "may be waived in circumstances listed in this paragraph, including independent evidence of misconduct "
        "unrelated to the protected disclosure. Commanders initiate required flags under AR 600–8–2 when "
        "applicable and process separations under AR 635–200, AR 600–8–24, AR 135–175, or AR 135–178 as "
        "appropriate to component and grade. Failure to apply Limited Use correctly can taint characterization "
        "and undermine both discipline and treatment."
    ),
    "4-5": (
        "Commanders conduct drug testing for authorized purposes only. Test bases include inspection (IR), "
        "unit sweep (IU), probable cause (PO), competence for duty / command-directed (CO), rehabilitation "
        "(RO), medical (MO), accident or safety investigation (AO), consent (VO), new-entrant (NO), and other "
        "authorized codes (OO) as published by DPRR. Inspection testing is a function of command under Military "
        "Rules of Evidence 313. Probable cause testing requires consultation with the supporting legal advisor. "
        "Do not invent additional test bases in local SOPs. See appendix D for collection procedures and "
        "paragraph 4–10 for smart testing techniques."
    ),
    "4-10": (
        "Smart testing means unpredictable selection of testers, dates, times, and locations so that Soldiers "
        "cannot predict when they will be tested. Units avoid patterns such as always testing on Mondays, after "
        "payday, or only during morning accountability. Battalion and unit deterrence leaders use Web DTP random "
        "selection and protect the integrity of the notification roster. Smart testing is a deterrence technique, "
        "not a separate legal basis for testing. See appendix B, question B–12, and do not restate the full "
        "collection SOP here."
    ),
    "B-10": (
        "The objective of the Limited Use Policy is to facilitate identification of alcohol and other drug "
        "abusers by encouraging self-referral and to facilitate rehabilitation of those who demonstrate "
        "potential for rehabilitation and retention. In short, Limited Use allows a Soldier to get help and "
        "make a new start without being punished for certain past offenses. It is not intended to protect a "
        "Soldier who is attempting to avoid disciplinary or adverse administrative action. This is a complicated "
        "policy. The supporting legal advisor helps apply it. Positive tests after a lawful order to test are "
        "not protected. See paragraphs 10–11 through 10–13 rather than restating the full legal definition here."
    ),
}


CHAPTER_CONTEXT = {cid: title for cid, _label, title in CHAPTERS}


def body_for(chapter: str, number: str, title: str) -> str:
    if number in SPECIAL_BODIES:
        return SPECIAL_BODIES[number]
    chapter_title = CHAPTER_CONTEXT.get(chapter, "this chapter")
    return (
        f"Working-copy baseline text for {number}, {title}. This paragraph sits in {chapter_title} of "
        f"ACTIVE AR 600–85 (4 October 2024; administrative revisions 27 February 2025 and 19 February 2026). "
        f"Editors will refine official-style policy language here without mutating the locked baseline. "
        f"Preserve hierarchy, cross-references, and defined terms. Where sister publications already govern "
        f"the action (for example AR 600–8–2, AR 635–200, AR 135–175, AR 135–178, AR 600–8–24, DA Pam 600–85, "
        f"or 42 CFR Part 2), cite those sources rather than copying their text. Commanders, ASAP managers, "
        f"deterrence leaders, medical review officers, and legal advisors apply this paragraph with the rest "
        f"of the regulation. Search terms: {title.lower()}, ASAP, deterrence, prevention, treatment, "
        f"Limited Use Policy, confidentiality, urinalysis, ADAPT, DAMIS, FTDTL."
    )


def write_png(path: Path) -> None:
    w, h = 256, 256
    gold = (191, 161, 74, 255)
    black = (18, 18, 16, 255)
    cream = (244, 241, 234, 255)
    olive = (61, 74, 46, 255)
    pixels = bytearray()
    cx, cy, r_outer, r_inner = 128, 128, 118, 96
    for y in range(h):
        for x in range(w):
            dx, dy = x - cx, y - cy
            d2 = dx * dx + dy * dy
            if d2 > r_outer * r_outer:
                pixels.extend(cream)
            elif d2 > r_inner * r_inner:
                pixels.extend(gold if ((x + y) // 8) % 2 == 0 else black)
            else:
                # Simple shield / star-ish field
                in_star = abs(dx) + abs(dy) < 42
                pixels.extend(gold if in_star else olive)

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    raw = b"".join(b"\x00" + pixels[y * w * 4 : (y + 1) * w * 4] for y in range(h))
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(png)


def main() -> None:
    dest = ROOT / "lib" / "seed" / "baseline-document.json"
    keep: dict[str, str] = {}
    if dest.exists():
        old = json.loads(dest.read_text(encoding="utf-8"))
        for chapter in old.get("chapters", []):
            for section in chapter.get("sections", []):
                body = section.get("body") or ""
                if body and not body.startswith("Working-copy baseline text for"):
                    keep[section["id"]] = body

    chapters = []
    for cid, label, title in CHAPTERS:
        sections = []
        for chapter, number, sec_title in PARAS:
            if chapter != cid:
                continue
            sections.append(
                {
                    "id": number,
                    "number": number,
                    "title": sec_title,
                    "body": keep.get(number) or body_for(chapter, number, sec_title),
                }
            )
        chapters.append({"id": cid, "label": label, "title": title, "sections": sections})

    out = {
        "publication": "AR 600-85",
        "longTitle": "The Army Substance Abuse Program",
        "baselineLabel": "ACTIVE AR 600-85 (4 Oct 2024, admin revs 27 Feb 2025 / 19 Feb 2026)",
        "effectiveDate": "2024-10-04",
        "adminRevisions": ["2025-02-27", "2026-02-19"],
        "proponent": "Deputy Chief of Staff, G-1 (deterrence, testing, prevention); The Surgeon General (clinical)",
        "chapters": chapters,
    }

    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(out, indent=2), encoding="utf-8")
    seal = ROOT / "public" / "g1-seal.png"
    n = sum(len(c["sections"]) for c in chapters)
    if seal.exists():
        print(f"Wrote {dest} ({n} sections); left existing {seal} in place")
    else:
        write_png(seal)
        print(f"Wrote {dest} ({n} sections) and placeholder {seal}")


if __name__ == "__main__":
    main()
