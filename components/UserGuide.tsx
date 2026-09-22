"use client";

import { GuideMarkdown } from "@/components/GuideMarkdown";
import { GuideWalkthrough } from "@/components/GuideWalkthrough";
import { USER_GUIDE_MARKDOWN } from "@/lib/user-guide-copy";

export function UserGuide() {
  return (
    <article className="max-w-none font-doc text-army-cream">
      <p className="panel-heading mt-4">User Guide</p>
      <GuideWalkthrough />
      <GuideMarkdown source={USER_GUIDE_MARKDOWN} />
    </article>
  );
}
