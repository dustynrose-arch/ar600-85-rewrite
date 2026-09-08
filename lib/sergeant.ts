import { sectionByStableId } from "./assist-bind";
import { REDUNDANCY_LANES } from "./seed/redundancy-lanes";
import type { SergeantLaneState, Section, WorkingSection } from "./types";

export type SergeantFinding = {
  laneId: string;
  name: string;
  rationale: string;
  primaryCite: string;
  seeCite: string;
  hits: { sectionId: string; number: string; title: string }[];
  decision: SergeantLaneState | undefined;
};

export function runSergeant(
  sections: Record<string, WorkingSection | Section>,
  decisions: SergeantLaneState[],
): SergeantFinding[] {
  return REDUNDANCY_LANES.map((lane) => {
    const hits: SergeantFinding["hits"] = [];
    for (const section of Object.values(sections)) {
      if (!section?.id || sections[section.id] !== section) continue;
      const hay = `${section.title} ${section.body}`.toLowerCase();
      if (lane.keywords.some((keyword) => hay.includes(keyword))) {
        hits.push({ sectionId: section.id, number: section.number, title: section.title });
      }
    }
    const primary = sectionByStableId(sections, lane.primaryCite);
    return {
      laneId: lane.id,
      name: lane.name,
      rationale: lane.rationale,
      primaryCite: primary?.id ?? lane.primaryCite,
      seeCite: lane.seeCite,
      hits: hits.slice(0, 8),
      decision: decisions.find((item) => item.laneId === lane.id),
    };
  });
}
